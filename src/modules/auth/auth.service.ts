import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { appConfig } from "@/src/config";
import { UserService } from "../user/user.service";
import { User } from "../user/entities/user.entity";
import { AuditService } from "../audit/audit.service";
import { AuthDto, RegisterDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwt: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, ip: string) {
    const exists = await this.userService.findOneByEmail(dto.email);
    if (exists) throw new ConflictException("Email is already registered");

    const hash = await bcrypt.hash(dto.password, appConfig.recommended_bycrypt_rounds);
    const user = await this.userService.createUser({ name: dto.name, email: dto.email, password: hash });
    const { password, ...safe } = user;

    // TODO: call this.mailService.sendWelcome(user.email, user.name) once Shams's MailModule is merged into main
    await this.auditService.record({
      user_id: user.id,
      action: "CREATE",
      entity: "users",
      entity_id: user.id,
      new_values: safe,
      ip,
    });
    return safe;
  }

  async signIn(dto: AuthDto) {
    const user = await this.userService.findByEmailWithPassword(dto.email);
    // Same message for both cases, so nobody can tell which part was wrong
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
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
