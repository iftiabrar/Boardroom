import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LobbyRequest } from './entities/lobby-request.entity';
import { LobbyService } from './lobby.service';
import { LobbyController } from './lobby.controller';
import { Room } from '@/modules/rooms/entities/room.entity';
import { RoomMember } from '@/modules/rooms/entities/room-member.entity';
import { User } from '@/modules/user/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([LobbyRequest, Room, RoomMember, User])],
    controllers: [LobbyController],
    providers: [LobbyService],
    exports: [LobbyService],
})
export class LobbyModule { }