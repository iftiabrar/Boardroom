import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

export class AuditQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "rooms" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  entity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
