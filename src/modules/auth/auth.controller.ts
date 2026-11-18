import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body() dto: AuthDto) {
    return this.authService.signIn(dto);
  }

  @Get("me")
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
