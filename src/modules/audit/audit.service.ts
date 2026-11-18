import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";

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
  // STUB for the kickoff. Replaced with the real database version in A11.
  // manager is accepted now so calls made inside a transaction already have the final shape.
  async record(entry: AuditEntry, manager?: EntityManager) {
    console.log("[Audit]", entry.action, entry.entity, entry.entity_id ?? "", "by", entry.user_id ?? "unknown");
  }
}
