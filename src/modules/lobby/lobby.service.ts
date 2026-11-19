import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LobbyRequest, LobbyStatus } from './entities/lobby-request.entity';
import { CreateLobbyRequestDto } from './dto/create-lobby-request.dto';
import { ApproveLobbyRequestDto } from './dto/decide-lobby-request.dto';
import { Room } from '@/modules/rooms/entities/room.entity';
import { RoomMember } from '@/modules/rooms/entities/room-member.entity';
import { Invite } from '@/modules/invites/entities/invite.entity';
import { RoomRole } from '@/common/enums/room-role.enum';
import { User } from '@/modules/user/entities/user.entity';
import { MailService } from '@/mails/mail.service';

@Injectable()
export class LobbyService {
    constructor(
        @InjectRepository(LobbyRequest)
        private readonly lobbyRepo: Repository<LobbyRequest>,
        @InjectRepository(Room)
        private readonly roomRepo: Repository<Room>,
        @InjectRepository(RoomMember)
        private readonly memberRepo: Repository<RoomMember>,
        @InjectRepository(Invite)
        private readonly inviteRepo: Repository<Invite>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly mailService: MailService,
        private readonly dataSource: DataSource,
    ) { }

    async requestJoin(roomId: string, userId: string, dto: CreateLobbyRequestDto) {
        const room = await this.roomRepo.findOne({ where: { id: roomId } });
        if (!room) throw new NotFoundException('Room not found');

        const existingMember = await this.memberRepo.findOne({
            where: { room_id: roomId, user_id: userId },
        });
        if (existingMember) {
            throw new ConflictException('You are already a member of this room');
        }

        const currentCount = await this.memberRepo.count({ where: { room_id: roomId } });
        if (currentCount >= room.max_members) {
            throw new ConflictException('Room is full');
        }

        if (!room.requires_approval) {
            const member = this.memberRepo.create({
                room_id: roomId,
                user_id: userId,
                role: RoomRole.VIEWER,
            });
            await this.memberRepo.save(member);
            return {
                status: 'joined',
                message: 'Joined room directly',
                room_id: roomId,
                role: member.role,
            };
        }

        const existingPending = await this.lobbyRepo.findOne({
            where: { room_id: roomId, user_id: userId, status: LobbyStatus.PENDING },
        });
        if (existingPending) {
            throw new ConflictException('You already have a pending join request for this room');
        }

        const req = this.lobbyRepo.create({
            room_id: roomId,
            user_id: userId,
            message: dto.message,
            status: LobbyStatus.PENDING,
        });

        return this.lobbyRepo.save(req);
    }

    async listPendingRequests(roomId: string) {
        return this.lobbyRepo.find({
            where: { room_id: roomId, status: LobbyStatus.PENDING },
            relations: ['user'],
            order: { created_at: 'ASC' },
        });
    }

    async getRequestById(roomId: string, requestId: string) {
        const request = await this.lobbyRepo.findOne({
            where: { id: requestId, room_id: roomId },
            relations: ['user'],
        });
        if (!request) throw new NotFoundException('Lobby request not found');
        return request;
    }

    async listMyRequests(userId: string) {
        return this.lobbyRepo.find({
            where: { user_id: userId },
            relations: ['room'],
            order: { created_at: 'DESC' },
        });
    }

    async cancelMyRequest(requestId: string, userId: string) {
        const request = await this.lobbyRepo.findOne({
            where: { id: requestId },
        });
        if (!request) throw new NotFoundException('Lobby request not found');

        if (request.user_id !== userId) {
            throw new ForbiddenException('You can only cancel your own join requests');
        }

        if (request.status !== LobbyStatus.PENDING) {
            throw new ConflictException(`Cannot cancel request because it is already ${request.status}`);
        }

        await this.lobbyRepo.remove(request);
        return {
            message: 'Lobby request cancelled successfully',
            request_id: requestId,
        };
    }

    async approveRequest(
        roomId: string,
        reqId: string,
        deciderId: string,
        dto: ApproveLobbyRequestDto,
    ) {
        if (dto.role === RoomRole.OWNER) {
            throw new BadRequestException('Cannot assign OWNER role via lobby approval');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let approvedRequest: LobbyRequest;
        let lockedRoom: Room;
        let recipientEmail: string | undefined;

        try {
            // 1. Lock the Room row with pessimistic_write
            const room = await queryRunner.manager.findOne(Room, {
                where: { id: roomId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!room) throw new NotFoundException('Room not found');
            lockedRoom = room;

            // 2. Fetch the lobby request inside the transaction
            const request = await queryRunner.manager.findOne(LobbyRequest, {
                where: { id: reqId, room_id: roomId },
            });
            if (!request) throw new NotFoundException('Lobby request not found');

            if (request.status !== LobbyStatus.PENDING) {
                throw new ConflictException(`Request is already ${request.status}`);
            }

            // 3. Check room capacity -> 409 Conflict if full
            const memberCount = await queryRunner.manager.count(RoomMember, {
                where: { room_id: roomId },
            });
            if (memberCount >= room.max_members) {
                throw new ConflictException('Room is full');
            }

            // 4. If linked to an invite, lock the Invite row with pessimistic_write, assert usable & increment uses
            let assignedRole = dto.role;
            if (request.invite_id) {
                const invite = await queryRunner.manager.findOne(Invite, {
                    where: { id: request.invite_id },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!invite) throw new NotFoundException('Associated invite not found');

                this.assertInviteUsable(invite);

                invite.uses += 1;
                await queryRunner.manager.save(invite);

                let assignedRole: RoomRole | undefined = dto.role;
                if (!assignedRole) {
                    assignedRole = invite.role;
                }
            }

            // 5. Add member if not already in room
            const existingMember = await queryRunner.manager.findOne(RoomMember, {
                where: { room_id: roomId, user_id: request.user_id },
            });

            const finalRole = assignedRole ?? RoomRole.VIEWER;
            if (!existingMember) {
                const member = queryRunner.manager.create(RoomMember, {
                    room_id: roomId,
                    user_id: request.user_id,
                    role: finalRole,
                });
                await queryRunner.manager.save(member);
            }

            // 6. Mark request as approved
            request.status = LobbyStatus.APPROVED;
            request.decided_by = deciderId;
            request.decided_at = new Date();
            approvedRequest = await queryRunner.manager.save(request);

            const requester = await queryRunner.manager.findOne(User, {
                where: { id: request.user_id },
            });
            recipientEmail = requester?.email;

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        if (recipientEmail) {
            await this.mailService.sendLobbyDecision(recipientEmail, lockedRoom.name, true);
        }

        return {
            message: 'Lobby request approved',
            request_id: approvedRequest.id,
            user_id: approvedRequest.user_id,
            role: dto.role ?? RoomRole.VIEWER,
        };
    }

    async rejectRequest(roomId: string, reqId: string, deciderId: string) {
        const request = await this.lobbyRepo.findOne({
            where: { id: reqId, room_id: roomId },
            relations: ['user', 'room'],
        });
        if (!request) throw new NotFoundException('Lobby request not found');
        if (request.status !== LobbyStatus.PENDING) {
            throw new ConflictException(`Request is already ${request.status}`);
        }

        request.status = LobbyStatus.REJECTED;
        request.decided_by = deciderId;
        request.decided_at = new Date();
        await this.lobbyRepo.save(request);

        if (request.user?.email && request.room?.name) {
            await this.mailService.sendLobbyDecision(
                request.user.email,
                request.room.name,
                false,
            );
        }

        return {
            message: 'Lobby request rejected',
            request_id: request.id,
        };
    }

    private assertInviteUsable(invite: Invite) {
        if (invite.revoked_at) {
            throw new ConflictException('This invite has been revoked');
        }
        if (new Date(invite.expires_at) <= new Date()) {
            throw new ConflictException('This invite has expired');
        }
        if (
            invite.max_uses !== null &&
            invite.max_uses !== undefined &&
            invite.uses >= invite.max_uses
        ) {
            throw new ConflictException('This invite has reached its maximum uses');
        }
    }
}