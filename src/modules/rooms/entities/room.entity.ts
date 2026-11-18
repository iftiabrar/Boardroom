import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "@/modules/user/entities/user.entity";
import { RoomMember } from "./room-member.entity";
@Entity({ name: "rooms" })
export class Room {
  @PrimaryGeneratedColumn("uuid") id!: string;
 
  @Column("uuid") owner_id!: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;
 
  @Column({ length: 100 }) name!: string;
  @Column({ length: 500, nullable: true }) description?: string;
  @Column({ default: 10 }) max_members!: number;
  @Column({ default: true }) requires_approval!: boolean;
 
  @OneToMany(() => RoomMember, (m) => m.room) members!: RoomMember[];
 
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}
