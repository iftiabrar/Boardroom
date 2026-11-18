import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateInvitesTable1800000400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'invites',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    { name: 'room_id', type: 'uuid' },
                    { name: 'created_by', type: 'uuid' },
                    { name: 'token', type: 'varchar', length: '120', isUnique: true },
                    { name: 'role', type: 'varchar', length: '10', default: "'viewer'" },
                    { name: 'expires_at', type: 'timestamp' },
                    { name: 'max_uses', type: 'int', isNullable: true },
                    { name: 'uses', type: 'int', default: 0 },
                    { name: 'revoked_at', type: 'timestamp', isNullable: true },
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
                        columnNames: ['created_by'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
                indices: [{ columnNames: ['room_id'] }, { columnNames: ['token'] }],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('invites', true);
    }
}