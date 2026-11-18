import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";
import { STRONG_PASSWORD_MESSAGE, STRONG_PASSWORD_REGEX } from "@/common/constants/password.constant";

export class AuthDto {
  @ApiProperty({ example: "admin@boardroom.test" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "Admin@12345" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: "Abrar Faiaz" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @ApiProperty({ example: "abrar@boardroom.test" })
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @ApiProperty({ example: "Strong@123" })
  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE })
  password!: string;
}
