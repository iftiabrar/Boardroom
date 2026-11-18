import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from '@/modules/rooms/entities/room.entity';
import { User } from '@/modules/user/entities/user.entity';
import { RoomRole } from '@/common/enums/room-role.enum';

@Entity({ name: 'invites' })
export class Invite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    room_id!: string;

    @ManyToOne(() => Room, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room!: Room;

    @Column('uuid')
    created_by!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by' })
    creator!: User;

    @Column({ length: 120, unique: true })
    token!: string;

    @Column({ type: 'varchar', length: 10, default: RoomRole.VIEWER })
    role!: RoomRole;

    @Column({ type: 'timestamp' })
    expires_at!: Date;

    @Column({ type: 'int', nullable: true })
    max_uses?: number;

    @Column({ type: 'int', default: 0 })
    uses!: number;

    @Column({ type: 'timestamp', nullable: true })
    revoked_at?: Date;

    @CreateDateColumn()
    created_at!: Date;
}