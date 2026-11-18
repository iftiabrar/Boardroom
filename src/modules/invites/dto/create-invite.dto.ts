import { IsEmail, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { RoomRole } from '@/common/enums/room-role.enum';

export class CreateInviteDto {
    @IsOptional()
    @IsEnum(RoomRole)
    role?: RoomRole = RoomRole.VIEWER;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(168) // max 7 days in hours
    expires_in_hours?: number = 24;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    max_uses?: number;

    @IsOptional()
    @IsEmail()
    email?: string;
}