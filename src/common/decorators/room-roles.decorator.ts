// room-roles.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { RoomRole } from "@/common/enums/room-role.enum";
export const ROOM_ROLES_KEY = "roomRoles";
export const RoomRoles = (...roles: RoomRole[]) => SetMetadata(ROOM_ROLES_KEY, roles);
 
