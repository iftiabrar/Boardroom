import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { ResponseMessage } from "@/common/decorators/response-message.decorator";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { AuthService } from "./auth.service";
import { AuthDto, RegisterDto } from "./dto/auth.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  @ResponseMessage("Account created")
  register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  @ResponseMessage("Logged in")
  login(@Body() dto: AuthDto) {
    return this.authService.signIn(dto);
  }

  @Get("me")
  @ApiBearerAuth()
  @ResponseMessage("Current user")
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
