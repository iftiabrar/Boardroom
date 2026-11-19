import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Invite } from './entities/invite.entity';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';
import { Room } from '@/modules/rooms/entities/room.entity';
import { RoomMember } from '@/modules/rooms/entities/room-member.entity';
import { LobbyRequest, LobbyStatus } from '@/modules/lobby/entities/lobby-request.entity';
import { RoomRole } from '@/common/enums/room-role.enum';
import { User } from '@/modules/user/entities/user.entity';
import { MailService } from '@/mails/mail.service';
import { appConfig } from '@/config/app.config';

@Injectable()
export class InvitesService {
    constructor(
        @InjectRepository(Invite)
        private readonly inviteRepo: Repository<Invite>,
        @InjectRepository(Room)
        private readonly roomRepo: Repository<Room>,
        @InjectRepository(RoomMember)
        private readonly memberRepo: Repository<RoomMember>,
        @InjectRepository(LobbyRequest)
        private readonly lobbyRepo: Repository<LobbyRequest>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly mailService: MailService,
        private readonly dataSource: DataSource,
    ) { }

    async createInvite(roomId: string, inviterId: string, dto: CreateInviteDto) {
        if (dto.role === RoomRole.OWNER) {
            throw new BadRequestException('Cannot create an invite with OWNER role');
        }

        const room = await this.roomRepo.findOne({ where: { id: roomId } });
        if (!room) throw new NotFoundException('Room not found');

        const token = randomBytes(24).toString('hex');
        const hours = dto.expires_in_hours ?? 24;
        const expires_at = new Date(Date.now() + hours * 60 * 60 * 1000);

        const invite = this.inviteRepo.create({
            room_id: roomId,
            created_by: inviterId,
            token,
            role: dto.role ?? RoomRole.VIEWER,
            expires_at,
            max_uses: dto.max_uses,
        });

        const saved = await this.inviteRepo.save(invite);
        const link = `${appConfig.env.FRONTEND_URL}/invites/${saved.token}`;

        if (dto.email) {
            const inviter = await this.userRepo.findOne({ where: { id: inviterId } });
            const inviterName = (inviter as any)?.name || inviter?.email || 'A room owner';
            await this.mailService.sendInvite(dto.email, room.name, inviterName, link);
        }

        return {
            ...saved,
            use_count: saved.uses,
            link,
        };
    }

    async listRoomInvites(roomId: string) {
        return this.inviteRepo.find({
            where: { room_id: roomId },
            order: { created_at: 'DESC' },
        });
    }

    async getInviteById(roomId: string, inviteId: string) {
        const invite = await this.inviteRepo.findOne({
            where: { id: inviteId, room_id: roomId },
        });
        if (!invite) throw new NotFoundException('Invite not found');
        return {
            ...invite,
            use_count: invite.uses,
        };
    }

    async updateInvite(roomId: string, inviteId: string, dto: UpdateInviteDto) {
        const invite = await this.inviteRepo.findOne({
            where: { id: inviteId, room_id: roomId },
        });
        if (!invite) throw new NotFoundException('Invite not found');

        if (dto.role === RoomRole.OWNER) {
            throw new BadRequestException('Cannot set invite role to OWNER');
        }

        if (dto.expires_at !== undefined) {
            invite.expires_at = new Date(dto.expires_at);
        }
        if (dto.max_uses !== undefined) {
            invite.max_uses = dto.max_uses;
        }
        if (dto.role !== undefined) {
            invite.role = dto.role;
        }

        const updated = await this.inviteRepo.save(invite);
        return {
            ...updated,
            use_count: updated.uses,
        };
    }

    async revokeInvite(roomId: string, inviteId: string) {
        const invite = await this.inviteRepo.findOne({
            where: { id: inviteId, room_id: roomId },
        });
        if (!invite) throw new NotFoundException('Invite not found');

        if (invite.revoked_at) {
            throw new ConflictException('Invite is already revoked');
        }

        invite.revoked_at = new Date();
        await this.inviteRepo.save(invite);
        return { message: 'Invite revoked successfully' };
    }

    async getInvitePreview(code: string) {
        const invite = await this.inviteRepo.findOne({
            where: { token: code },
            relations: ['room', 'creator'],
        });
        if (!invite) throw new NotFoundException('Invite not found');

        this.assertInviteUsable(invite);

        const memberCount = await this.memberRepo.count({
            where: { room_id: invite.room_id },
        });

        return {
            code: invite.token,
            token: invite.token,
            role: invite.role,
            expires_at: invite.expires_at,
            requires_approval: invite.room.requires_approval,
            room: {
                id: invite.room.id,
                name: invite.room.name,
                description: invite.room.description,
                member_count: memberCount,
                max_members: invite.room.max_members,
            },
            invited_by: (invite.creator as any)?.name || invite.creator?.email,
        };
    }

    async joinByInvite(code: string, userId: string, message?: string) {
        const inviteCheck = await this.inviteRepo.findOne({
            where: { token: code },
            relations: ['room'],
        });
        if (!inviteCheck) throw new NotFoundException('Invite not found');

        this.assertInviteUsable(inviteCheck);

        const existingMember = await this.memberRepo.findOne({
            where: { room_id: inviteCheck.room_id, user_id: userId },
        });
        if (existingMember) {
            throw new ConflictException('You are already a member of this room');
        }

        // If room requires approval, create a pending lobby request linked to this invite
        if (inviteCheck.room.requires_approval) {
            const currentMembers = await this.memberRepo.count({
                where: { room_id: inviteCheck.room_id },
            });
            if (currentMembers >= inviteCheck.room.max_members) {
                throw new ConflictException('Room is full');
            }

            const existingPending = await this.lobbyRepo.findOne({
                where: {
                    room_id: inviteCheck.room_id,
                    user_id: userId,
                    status: LobbyStatus.PENDING,
                },
            });
            if (existingPending) {
                throw new ConflictException('You already have a pending join request for this room');
            }

            const lobbyReq = this.lobbyRepo.create({
                room_id: inviteCheck.room_id,
                user_id: userId,
                invite_id: inviteCheck.id,
                message: message ?? 'Requesting access via invite link',
                status: LobbyStatus.PENDING,
            });
            const savedReq = await this.lobbyRepo.save(lobbyReq);

            return {
                status: 'pending',
                message: 'Join request submitted and awaiting owner approval',
                request: savedReq,
            };
        }

        // Otherwise join directly inside an explicit QueryRunner transaction with pessimistic_write locks
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const invite = await queryRunner.manager.findOne(Invite, {
                where: { id: inviteCheck.id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!invite) throw new NotFoundException('Invite not found');

            this.assertInviteUsable(invite);

            const room = await queryRunner.manager.findOne(Room, {
                where: { id: invite.room_id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!room) throw new NotFoundException('Room not found');

            const currentMembers = await queryRunner.manager.count(RoomMember, {
                where: { room_id: room.id },
            });
            if (currentMembers >= room.max_members) {
                throw new ConflictException('Room is full');
            }

            const member = queryRunner.manager.create(RoomMember, {
                room_id: room.id,
                user_id: userId,
                role: invite.role,
            });
            await queryRunner.manager.save(member);

            invite.uses += 1;
            await queryRunner.manager.save(invite);

            await queryRunner.commitTransaction();

            return {
                status: 'joined',
                message: 'Joined room successfully',
                room_id: room.id,
                role: member.role,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    assertInviteUsable(invite: Invite) {
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