import { IsEnum, IsOptional } from 'class-validator';
import { RoomRole } from '@/common/enums/room-role.enum';

export class ApproveLobbyRequestDto {
    @IsOptional()
    @IsEnum(RoomRole)
    role?: RoomRole = RoomRole.VIEWER;
}