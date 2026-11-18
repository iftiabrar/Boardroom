import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Invite } from './entities/invite.entity';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Room } from '@/modules/rooms/entities/room.entity';
import { RoomMember } from '@/modules/rooms/entities/room-member.entity';
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
            link,
        };
    }

    async listRoomInvites(roomId: string) {
        return this.inviteRepo.find({
            where: { room_id: roomId },
            order: { created_at: 'DESC' },
        });
    }

    async revokeInvite(roomId: string, inviteId: string) {
        const invite = await this.inviteRepo.findOne({
            where: { id: inviteId, room_id: roomId },
        });
        if (!invite) throw new NotFoundException('Invite not found');

        if (invite.revoked_at) {
            throw new BadRequestException('Invite is already revoked');
        }

        invite.revoked_at = new Date();
        await this.inviteRepo.save(invite);
        return { message: 'Invite revoked successfully' };
    }

    async getInvitePreview(token: string) {
        const invite = await this.inviteRepo.findOne({
            where: { token },
            relations: ['room', 'creator'],
        });
        if (!invite) throw new NotFoundException('Invite not found');

        this.validateInviteUsable(invite);

        const memberCount = await this.memberRepo.count({
            where: { room_id: invite.room_id },
        });

        return {
            token: invite.token,
            role: invite.role,
            expires_at: invite.expires_at,
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

    async acceptInvite(token: string, userId: string) {
        return this.dataSource.transaction(async (manager) => {
            const inviteRepo = manager.getRepository(Invite);
            const roomRepo = manager.getRepository(Room);
            const memberRepo = manager.getRepository(RoomMember);

            const invite = await inviteRepo.findOne({ where: { token } });
            if (!invite) throw new NotFoundException('Invite not found');

            this.validateInviteUsable(invite);

            const room = await roomRepo.findOne({ where: { id: invite.room_id } });
            if (!room) throw new NotFoundException('Room not found');

            const existing = await memberRepo.findOne({
                where: { room_id: room.id, user_id: userId },
            });
            if (existing) {
                return {
                    message: 'You are already a member of this room',
                    room_id: room.id,
                    role: existing.role,
                };
            }

            const currentMembers = await memberRepo.count({ where: { room_id: room.id } });
            if (currentMembers >= room.max_members) {
                throw new ForbiddenException('Room has reached its maximum member limit');
            }

            const member = memberRepo.create({
                room_id: room.id,
                user_id: userId,
                role: invite.role,
            });
            await memberRepo.save(member);

            invite.uses += 1;
            await inviteRepo.save(invite);

            return {
                message: 'Joined room successfully',
                room_id: room.id,
                role: member.role,
            };
        });
    }

    private validateInviteUsable(invite: Invite) {
        if (invite.revoked_at) {
            throw new BadRequestException('This invite has been revoked');
        }
        if (new Date(invite.expires_at) <= new Date()) {
            throw new BadRequestException('This invite has expired');
        }
        if (invite.max_uses !== null && invite.max_uses !== undefined && invite.uses >= invite.max_uses) {
            throw new BadRequestException('This invite has reached its maximum uses');
        }
    }
}