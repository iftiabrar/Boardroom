import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { paginate } from "@/common/helpers/paginate";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { RoomRole } from "@/common/enums/room-role.enum";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { AuditService } from "../audit/audit.service";
import { RoomMember } from "./entities/room-member.entity";

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(RoomMember) private readonly memberRepository: Repository<RoomMember>,
    private readonly auditService: AuditService,
  ) {}

  async list(roomId: string, q: PaginationQueryDto) {
    const [rows, total] = await this.memberRepository.findAndCount({
      where: { room_id: roomId },
      relations: { user: true },
      order: { joined_at: "ASC" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });
   
    const items = rows.map((m) => ({
      user_id: m.user_id,
      name: m.user.name,
      role: m.role,
      joined_at: m.joined_at,
    }));
    return paginate(items, total, q);
  }

  async findOne(roomId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { room_id: roomId, user_id: userId },
      relations: { user: true },
    });
    if (!member) throw new NotFoundException("This user is not in the room");
    return {
      user_id: member.user_id,
      name: member.user.name,
      role: member.role,
      joined_at: member.joined_at,
    };
  }

  async changeRole(roomId: string, userId: string, role: RoomRole, user: AuthUser, ip: string) {
    const member = await this.memberRepository.findOne({
      where: { room_id: roomId, user_id: userId },
    });
    if (!member) throw new NotFoundException("This user is not in the room");
    if (member.role === RoomRole.OWNER) {
      throw new ConflictException("The owner's role cannot be changed");
    }

    const old_values = { role: member.role };
    member.role = role;
    await this.memberRepository.save(member);

    await this.auditService.record({
      user_id: user.id,
      action: "UPDATE",
      entity: "room_members",
      entity_id: roomId + ":" + userId,
      old_values,
      new_values: { role },
      ip,
    });
    return member;
  }

  async remove(roomId: string, userId: string, user: AuthUser, ip: string) {
    const member = await this.memberRepository.findOne({
      where: { room_id: roomId, user_id: userId },
    });
    if (!member) throw new NotFoundException("This user is not in the room");
    if (member.role === RoomRole.OWNER) {
      throw new ConflictException("The owner cannot be removed");
    }

    await this.memberRepository.delete({ room_id: roomId, user_id: userId });

    await this.auditService.record({
      user_id: user.id,
      action: "DELETE",
      entity: "room_members",
      entity_id: roomId + ":" + userId,
      old_values: member,
      ip,
    });
    return { room_id: roomId, user_id: userId };
  }

  
  async leave(me: RoomMember, user: AuthUser, ip: string) {
    if (me.role === RoomRole.OWNER) {
      throw new ConflictException("The owner cannot leave. Delete the room instead.");
    }

    await this.memberRepository.delete({ room_id: me.room_id, user_id: me.user_id });

    await this.auditService.record({
      user_id: user.id,
      action: "DELETE",
      entity: "room_members",
      entity_id: me.room_id + ":" + me.user_id,
      old_values: me,
      ip,
    });
    return { room_id: me.room_id };
  }
}
