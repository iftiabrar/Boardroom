import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { paginate } from "@/common/helpers/paginate";
import { Role } from "@/common/enums/role.enum";
import { RoomRole } from "@/common/enums/room-role.enum";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { AuditService } from "../audit/audit.service";
import { Room } from "./entities/room.entity";
import { RoomMember } from "./entities/room-member.entity";
import { CreateRoomDto, RoomQueryDto, UpdateRoomDto } from "./dto/room.dto";

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomMember) private readonly memberRepository: Repository<RoomMember>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  
  async create(user: AuthUser, dto: CreateRoomDto, ip: string) {
    return this.dataSource.transaction(async (manager) => {
      const room = await manager.save(Room, manager.create(Room, { ...dto, owner_id: user.id }));
      await manager.save(RoomMember, { room_id: room.id, user_id: user.id, role: RoomRole.OWNER });
      await this.auditService.record(
        {
          user_id: user.id,
          action: "CREATE",
          entity: "rooms",
          entity_id: room.id,
          new_values: room,
          ip,
        },
        manager,
      );
      return room;
    });
  }

  
  async findMine(user: AuthUser, q: RoomQueryDto) {
    const qb = this.roomRepository
      .createQueryBuilder("room")
      .innerJoin(RoomMember, "m", "m.room_id = room.id AND m.user_id = :uid", { uid: user.id })
      .orderBy("room.created_at", "DESC")
      .skip((q.page - 1) * q.limit)
      .take(q.limit);

    if (q.search) {
      qb.andWhere("room.name ILIKE :s", { s: "%" + q.search + "%" });
    }

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, q);
  }

 
  async findOne(room: Room, me: RoomMember) {
    const member_count = await this.memberRepository.count({ where: { room_id: room.id } });
    return { ...room, member_count, my_role: me.role };
  }

  async update(room: Room, dto: UpdateRoomDto, user: AuthUser, ip: string) {
    if (dto.max_members !== undefined) {
      const count = await this.memberRepository.count({ where: { room_id: room.id } });
      if (dto.max_members < count) {
        throw new ConflictException(
          "max_members cannot be lower than the current member count (" + count + ")",
        );
      }
    }

    const old = { ...room };
    Object.assign(room, dto);
    const saved = await this.roomRepository.save(room);

    await this.auditService.record({
      user_id: user.id,
      action: "UPDATE",
      entity: "rooms",
      entity_id: room.id,
      old_values: old,
      new_values: saved,
      ip,
    });
    return saved;
  }

  
  async remove(roomId: string, user: AuthUser, ip: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException("Room not found");
    if (user.role !== Role.ADMIN && room.owner_id !== user.id) {
      throw new ForbiddenException("Only the owner or an admin can delete this room");
    }

    await this.roomRepository.delete({ id: roomId });

    await this.auditService.record({
      user_id: user.id,
      action: "DELETE",
      entity: "rooms",
      entity_id: roomId,
      old_values: room,
      ip,
    });
    return { id: roomId };
  }
}
