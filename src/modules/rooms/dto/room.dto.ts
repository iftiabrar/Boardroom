import { IsBoolean, IsIn, IsInt,  IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min,} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { RoomRole } from "@/common/enums/room-role.enum";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

export class CreateRoomDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100)
  name!: string;
 
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  description?: string;
 
  @ApiPropertyOptional({ default: 10 }) @IsOptional() @IsInt() @Min(2) @Max(50)
  max_members?: number;
 
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()
  requires_approval?: boolean;
}
 
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}      
 
export class RoomQueryDto extends PaginationQueryDto {
   @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) search?: string;
}
 
export class UpdateMemberRoleDto {
  @ApiProperty({ enum: [RoomRole.EDITOR, RoomRole.VIEWER] }) @IsIn([RoomRole.EDITOR, RoomRole.VIEWER])
  role!: RoomRole;
}
 

