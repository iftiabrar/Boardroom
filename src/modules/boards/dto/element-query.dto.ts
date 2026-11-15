import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class ElementQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ["stroke", "shape", "text", "sticky_note"],
  })
  @IsOptional()
  @IsIn(["stroke", "shape", "text", "sticky_note"])
  type?: string;
}