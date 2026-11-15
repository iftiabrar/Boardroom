import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsHexColor, IsIn, IsInt,
  IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min,
} from "class-validator";

export class StrokeDataDto {
  @IsArray() @ArrayMinSize(4) @ArrayMaxSize(4000)
  @IsNumber({}, { each: true })
  points!: number[];

  @IsHexColor() color!: string;

  @IsNumber() @Min(1) @Max(50) width!: number;
}

export class ShapeDataDto {
  @IsIn(["rect", "ellipse", "line", "arrow"]) shape!: string;
  @IsNumber() x!: number;
  @IsNumber() y!: number;
  @IsNumber() @Min(0) @Max(10000) width!: number;
  @IsNumber() @Min(0) @Max(10000) height!: number;
  @IsHexColor() color!: string;
}

export class TextDataDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) text!: string;
  @IsNumber() x!: number;
  @IsNumber() y!: number;
  @IsOptional() @IsInt() @Min(8) @Max(96) font_size?: number;
}

export class StickyNoteDataDto {
  @IsString() @MaxLength(500) text!: string;
  @IsNumber() x!: number;
  @IsNumber() y!: number;
  @IsHexColor() color!: string;
}