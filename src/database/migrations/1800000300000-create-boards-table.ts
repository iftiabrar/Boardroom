import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateBoardsTable1800000300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'boards',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'room_id',
            type: 'uuid',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'position',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
         foreignKeys: [
      {
        columnNames: ["room_id"],
        referencedTableName: "rooms",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      },
      {
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      },
    ],
  }),
);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('boards');
  }
}