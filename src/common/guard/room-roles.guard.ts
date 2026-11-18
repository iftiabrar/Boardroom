// room-roles.guard.ts
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException, } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { DataSource } from "typeorm";
import { isUUID } from "class-validator";
import { RoomRole } from "../enums/room-role.enum";
import { ROOM_ROLES_KEY } from "../decorators/room-roles.decorator";
import { Room } from "@/modules/rooms/entities/room.entity";
import { RoomMember } from "@/modules/rooms/entities/room-member.entity";
@Injectable()
export class RoomRolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private dataSource: DataSource) { }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const roomId = req.params.roomId;
    if (!isUUID(roomId)) throw new BadRequestException("roomId must be a valid UUID");

    const room = await this.dataSource.getRepository(Room).findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException("Room not found");

    const member = await this.dataSource.getRepository(RoomMember)
      .findOne({ where: { room_id: roomId, user_id: req.user.id } });
    if (!member) throw new ForbiddenException("You are not a member of this room");

    const roles = this.reflector.getAllAndOverride<RoomRole[]>(ROOM_ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (roles && !roles.includes(member.role)) {
      throw new ForbiddenException("This action needs one of these room roles: " + roles.join(", "));
    }

    req.room = room;
    req.roomMember = member;
    return true;
  }
}