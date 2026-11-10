import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "@/common/enums/role.enum";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 30 })
  name!: string;

  @Column({ length: 100, unique: true })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ default: Role.USER })
  role!: string;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}