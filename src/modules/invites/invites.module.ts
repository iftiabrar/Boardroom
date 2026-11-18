import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { Room } from '@/modules/rooms/entities/room.entity';
import { RoomMember } from '@/modules/rooms/entities/room-member.entity';
import { User } from '@/modules/user/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Invite, Room, RoomMember, User])],
    controllers: [InvitesController],
    providers: [InvitesService],
    exports: [InvitesService],
})
export class InvitesModule { }