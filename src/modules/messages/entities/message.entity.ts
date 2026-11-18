import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Room } from "../../rooms/entities/room.entity";
import { User } from "../../user/entities/user.entity";

@Entity({ name: "messages" })
@Index(["room_id", "created_at"])
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  room_id!: string;

  @Column({ type: "uuid", nullable: true })
  sender_id!: string | null;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "boolean", default: false })
  is_edited!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Room, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "sender_id" })
  sender!: User | null;
}