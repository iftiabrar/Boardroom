import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { appConfig } from "@/src/config";
import { paginate } from "@/common/helpers/paginate";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { AuditService } from "../audit/audit.service";
import { User } from "./entities/user.entity";
import { UpdateProfileDto, UpdateUserStatusDto, UserQueryDto } from "./dto/user.dto";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  // ---------- used by AuthService and JwtStrategy ----------

  async createUser(data: Pick<User, "name" | "email" | "password">) {
    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // The password column has select: false, so load it on purpose for login
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  }

  // ---------- user management (A10) ----------

  async findAll(q: UserQueryDto) {
    const where = q.search
      ? [{ name: ILike("%" + q.search + "%") }, { email: ILike("%" + q.search + "%") }]
      : {};
    const [items, total] = await this.userRepository.findAndCount({
      where,
      order: { created_at: "DESC" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });
    return paginate(items, total, q);
  }

  async findOne(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(current: AuthUser, dto: UpdateProfileDto, ip: string) {
    const before = await this.findOne(current.id);
    const changes: Partial<User> = {};
    if (dto.name !== undefined) changes.name = dto.name;
    if (dto.password !== undefined) {
      changes.password = await bcrypt.hash(dto.password, appConfig.recommended_bycrypt_rounds);
    }
    if (Object.keys(changes).length) {
      await this.userRepository.update({ id: current.id }, changes);
    }
    const after = await this.findOne(current.id);
    await this.auditService.record({
      user_id: current.id,
      action: "UPDATE",
      entity: "users",
      entity_id: current.id,
      old_values: { name: before.name },
      new_values: { name: after.name, password_changed: dto.password !== undefined },
      ip,
    });
    return after;
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, admin: AuthUser, ip: string) {
    const before = await this.findOne(id);
    await this.userRepository.update({ id }, { is_active: dto.is_active });
    const after = await this.findOne(id);
    await this.auditService.record({
      user_id: admin.id,
      action: "UPDATE",
      entity: "users",
      entity_id: id,
      old_values: { is_active: before.is_active },
      new_values: { is_active: after.is_active },
      ip,
    });
    return after;
  }

  async deleteUser(id: string, admin: AuthUser, ip: string) {
    if (id === admin.id) throw new ConflictException("You cannot delete your own account");
    const user = await this.findOne(id);
    await this.userRepository.delete({ id });
    await this.auditService.record({
      user_id: admin.id,
      action: "DELETE",
      entity: "users",
      entity_id: id,
      old_values: user,
      ip,
    });
    return { id };
  }
}
