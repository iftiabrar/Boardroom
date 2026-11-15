import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Board } from "./board.entity";
import { User } from "../../user/entities/user.entity";

@Entity({ name: "board_elements" })
export class BoardElement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  board_id!: string;

  @Column({ type: "uuid", nullable: true })
  created_by!: string | null;

  @Column({ type: "varchar", length: 20 })
  type!: string;

  @Column({ type: "jsonb" })
  data!: Record<string, any>;

  @Column({ type: "integer", default: 0 })
  z_index!: number;

  @Column({ type: "integer", default: 1 })
  version!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Board, (board) => board.elements, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by" })
  creator!: User | null;
}