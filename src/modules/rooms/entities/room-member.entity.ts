import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Room } from "./room.entity";
import { User } from "@/modules/user/entities/user.entity";
import { RoomRole } from "@/common/enums/room-role.enum";
@Entity({ name: "room_members" })
export class RoomMember {
  @PrimaryColumn("uuid") room_id!: string;
  @PrimaryColumn("uuid") user_id!: string;
  @Column({ type: "varchar", length: 10, default: RoomRole.VIEWER }) role!: RoomRole;
  @CreateDateColumn() joined_at!: Date;
 
  @ManyToOne(() => Room, (r) => r.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;
 
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
