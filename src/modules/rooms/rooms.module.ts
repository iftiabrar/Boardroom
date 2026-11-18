import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Room } from "./entities/room.entity";
import { RoomMember } from "./entities/room-member.entity";
import { RoomsController } from "./rooms.controller";
import { MembersController } from "./members.controller";
import { RoomsService } from "./rooms.service";
import { MembersService } from "./members.service";

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomMember])],
  controllers: [RoomsController, MembersController],
  providers: [RoomsService, MembersService],
  exports: [RoomsService],
})
export class RoomsModule {}
