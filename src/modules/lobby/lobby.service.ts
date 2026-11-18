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
            throw new ForbiddenException('Room is full');
        }

        // If room does not require approval, add directly as viewer
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

    async approveRequest(
        roomId: string,
        reqId: string,
        deciderId: string,
        dto: ApproveLobbyRequestDto,
    ) {
        if (dto.role === RoomRole.OWNER) {
            throw new BadRequestException('Cannot assign OWNER role via lobby approval');
        }

        const result = await this.dataSource.transaction(async (manager) => {
            const lobbyRepo = manager.getRepository(LobbyRequest);
            const roomRepo = manager.getRepository(Room);
            const memberRepo = manager.getRepository(RoomMember);

            const request = await lobbyRepo.findOne({
                where: { id: reqId, room_id: roomId },
                relations: ['user', 'room'],
            });
            if (!request) throw new NotFoundException('Lobby request not found');
            if (request.status !== LobbyStatus.PENDING) {
                throw new BadRequestException(`Request is already ${request.status}`);
            }

            const room = await roomRepo.findOne({ where: { id: roomId } });
            if (!room) throw new NotFoundException('Room not found');

            const memberCount = await memberRepo.count({ where: { room_id: roomId } });
            if (memberCount >= room.max_members) {
                throw new ForbiddenException('Room has reached its maximum member limit');
            }

            const existingMember = await memberRepo.findOne({
                where: { room_id: roomId, user_id: request.user_id },
            });

            const assignedRole = dto.role ?? RoomRole.VIEWER;
            if (!existingMember) {
                const member = memberRepo.create({
                    room_id: roomId,
                    user_id: request.user_id,
                    role: assignedRole,
                });
                await memberRepo.save(member);
            }

            request.status = LobbyStatus.APPROVED;
            request.decided_by = deciderId;
            request.decided_at = new Date();
            await lobbyRepo.save(request);

            return { request, room };
        });

        if (result.request.user?.email) {
            await this.mailService.sendLobbyDecision(
                result.request.user.email,
                result.room.name,
                true,
            );
        }

        return {
            message: 'Lobby request approved',
            request_id: result.request.id,
            user_id: result.request.user_id,
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
            throw new BadRequestException(`Request is already ${request.status}`);
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
}