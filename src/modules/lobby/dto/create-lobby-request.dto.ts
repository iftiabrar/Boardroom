import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLobbyRequestDto {
    @IsOptional()
    @IsString()
    @MaxLength(300)
    message?: string;
}