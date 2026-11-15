import { ApiProperty } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
} from "class-validator";

export class CreateElementDto {
  @ApiProperty({
    enum: ["stroke", "shape", "text", "sticky_note"],
  })
  @IsIn(["stroke", "shape", "text", "sticky_note"])
  type!: string;

  @ApiProperty()
  @IsObject()
  data!: Record<string, any>;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  z_index?: number;
}