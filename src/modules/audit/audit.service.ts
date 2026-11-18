import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, FindOptionsWhere, Repository } from "typeorm";
import { paginate } from "@/common/helpers/paginate";
import { AuditLog } from "./entities/audit-log.entity";
import { AuditQueryDto } from "./dto/audit-query.dto";

export interface AuditEntry {
  user_id?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private readonly auditRepository: Repository<AuditLog>,
  ) {}

  // Call after every create, update and delete.
  // Pass manager when you are inside a transaction, so the audit row commits or rolls back with it.
  async record(entry: AuditEntry, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(AuditLog) : this.auditRepository;
    const clean = (v: any) => {
      if (!v) return null;
      const { password, ...rest } = v;
      return rest;
    };
    await repo.save(
      repo.create({
        ...entry,
        old_values: clean(entry.old_values),
        new_values: clean(entry.new_values),
      }),
    );
  }

  async findAll(q: AuditQueryDto) {
    const where: FindOptionsWhere<AuditLog> = {};
    if (q.entity) where.entity = q.entity;
    if (q.user_id) where.user_id = q.user_id;
    const [items, total] = await this.auditRepository.findAndCount({
      where,
      relations: { user: true },
      order: { created_at: "DESC" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });
    return paginate(items, total, q);
  }

  async findOne(id: string) {
    const log = await this.auditRepository.findOne({ where: { id }, relations: { user: true } });
    if (!log) throw new NotFoundException("Audit entry not found");
    return log;
  }
}
