import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { STRONG_PASSWORD_MESSAGE, STRONG_PASSWORD_REGEX } from "@/common/constants/password.constant";

export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Search by name or email" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "New Name" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ example: "Strong@123" })
  @IsOptional()
  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE })
  password?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  is_active!: boolean;
}
