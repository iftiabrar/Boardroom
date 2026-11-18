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

export enum LobbyStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity({ name: 'lobby_requests' })
export class LobbyRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    room_id!: string;

    @ManyToOne(() => Room, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room!: Room;

    @Column('uuid')
    user_id!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'varchar', length: 12, default: LobbyStatus.PENDING })
    status!: LobbyStatus;

    @Column({ length: 300, nullable: true })
    message?: string;

    @Column({ type: 'uuid', nullable: true })
    decided_by?: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'decided_by' })
    decider?: User;

    @Column({ type: 'timestamp', nullable: true })
    decided_at?: Date;

    @CreateDateColumn()
    created_at!: Date;
}