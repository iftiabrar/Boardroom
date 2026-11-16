import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { appConfig } from "@/src/config";
import { UserService } from "../user/user.service";
import { User } from "../user/entities/user.entity";
import { AuthDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwt: JwtService,
  ) {}

  async signIn(dto: AuthDto) {
    const user = await this.userService.findOneByEmail(dto.email);
    // TEMPORARY plain-text check. Replaced with bcrypt.compare in A8.
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (!user.is_active) throw new ForbiddenException("Account is inactive");

    const access_token = await this.signToken(user);
    const { password, ...safe } = user;
    return { access_token, expires_in: appConfig.env.JWT_EXPIRES_IN, user: safe };
  }

  private signToken(user: User) {
    return this.jwt.signAsync({ sub: user.id, email: user.email, name: user.name, role: user.role });
  }
}
