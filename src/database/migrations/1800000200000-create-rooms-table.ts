import { MigrationInterface, QueryRunner, Table } from "typeorm";



export class CreateRoomsTable1800000200000 implements MigrationInterface{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
  name: "rooms",
  columns: [
    { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
    { name: "owner_id", type: "uuid", isNullable: false },
    { name: "name", type: "varchar", length: "100", isNullable: false },
    { name: "description", type: "varchar", length: "500", isNullable: true },
    { name: "max_members", type: "int", default: 10 },
    { name: "requires_approval", type: "boolean", default: true },
    { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP(6)" },
    { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP(6)" },
  ],
  foreignKeys: [
    { columnNames: ["owner_id"], referencedTableName: "users", referencedColumnNames: ["id"], onDelete: "CASCADE" },
  ],
}));

}

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("rooms");
    }
}