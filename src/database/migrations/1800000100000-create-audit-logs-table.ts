import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateAuditLogsTable1800000100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "audit_logs",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "user_id",
                        type: "uuid",
                        isNullable: true,
                    },
                    {
                        name: "action",
                        type: "varchar",
                        length: "10",
                        isNullable: false,
                    },
                    {
                        name: "entity",
                        type: "varchar",
                        length: "40",
                        isNullable: false,
                    },
                    {
                        name: "entity_id",
                        type: "varchar",
                        length: "60",
                        isNullable: true,
                    },
                    {
                        name: "old_values",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "new_values",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "ip",
                        type: "varchar",
                        length: "60",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP(6)",
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ["user_id"],
                        referencedTableName: "users",
                        referencedColumnNames: ["id"],
                        onDelete: "SET NULL",
                    },
                ],
            }),
        );

        await queryRunner.createIndex(
            "audit_logs",
            new TableIndex({ name: "IDX_audit_logs_entity", columnNames: ["entity"] }),
        );
        await queryRunner.createIndex(
            "audit_logs",
            new TableIndex({ name: "IDX_audit_logs_user_id", columnNames: ["user_id"] }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("audit_logs");
    }
}
