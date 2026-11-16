import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, ValidationPipe } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtGuard } from "@/common/guard/jwt.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body(new ValidationPipe()) dto: AuthDto) {
    return this.authService.signIn(dto);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtGuard) // temporary: becomes global in A3
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
