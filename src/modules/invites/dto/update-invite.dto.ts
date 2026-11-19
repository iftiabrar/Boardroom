import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { RoomRole } from '@/common/enums/room-role.enum';

export class UpdateInviteDto {
    @IsOptional()
    @IsDateString()
    expires_at?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    max_uses?: number;

    @IsOptional()
    @IsEnum(RoomRole)
    role?: RoomRole;
}