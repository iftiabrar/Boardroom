import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@/src/modules/user/entities/user.entity";

@Entity({ name: "audit_logs" })
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  user_id!: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "user_id" })
  user?: User | null;

  @Column({ length: 10 })
  action!: string;

  @Column({ length: 40 })
  entity!: string;

  // 100 characters: room member actions log "roomId:userId" (73 characters)
  @Column({ type: "varchar", length: 100, nullable: true })
  entity_id!: string | null;

  @Column({ type: "jsonb", nullable: true })
  old_values!: Record<string, any> | null;

  @Column({ type: "jsonb", nullable: true })
  new_values!: Record<string, any> | null;

  @Column({ type: "varchar", length: 60, nullable: true })
  ip!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
