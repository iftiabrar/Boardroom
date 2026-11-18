import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateRoomMembersTable1800000200001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
  name: "room_members",
  columns: [
    { name: "room_id", type: "uuid", isPrimary: true },
    { name: "user_id", type: "uuid", isPrimary: true },
    { name: "role", type: "varchar", length: "10", default: "'viewer'" },
    { name: "joined_at", type: "timestamp", default: "CURRENT_TIMESTAMP(6)" },
  ],
  foreignKeys: [
    { columnNames: ["room_id"], referencedTableName: "rooms", referencedColumnNames: ["id"], onDelete: "CASCADE" },
    { columnNames: ["user_id"], referencedTableName: "users", referencedColumnNames: ["id"], onDelete: "CASCADE" },
  ],
  indices: [{ columnNames: ["user_id"] }],
}));

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("room_members");
    }

}
