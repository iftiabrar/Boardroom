import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Room } from "../../rooms/entities/room.entity";
import { User } from "../../user/entities/user.entity";
import { BoardElement } from "./board-element.entity";

@Entity({ name: "boards" })
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  room_id!: string;

  @Column({ type: "uuid", nullable: true })
  created_by!: string | null;

  @Column({ type: "varchar", length: 100 })
  title!: string;

  @Column({ type: "integer", default: 0 })
  position!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Room, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by" })
  creator!: User | null;

  @OneToMany(() => BoardElement, (element) => element.board)
  elements!: BoardElement[];
}