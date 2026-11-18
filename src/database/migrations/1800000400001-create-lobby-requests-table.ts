import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLobbyRequestsTable1800000400001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'lobby_requests',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    { name: 'room_id', type: 'uuid' },
                    { name: 'user_id', type: 'uuid' },
                    { name: 'status', type: 'varchar', length: '12', default: "'pending'" },
                    { name: 'message', type: 'varchar', length: '300', isNullable: true },
                    { name: 'decided_by', type: 'uuid', isNullable: true },
                    { name: 'decided_at', type: 'timestamp', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP(6)' },
                ],
                foreignKeys: [
                    {
                        columnNames: ['room_id'],
                        referencedTableName: 'rooms',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['decided_by'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'SET NULL',
                    },
                ],
                indices: [{ columnNames: ['room_id', 'status'] }],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('lobby_requests', true);
    }
}