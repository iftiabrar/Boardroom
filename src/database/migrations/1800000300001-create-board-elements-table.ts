import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateBoardElementsTable1800000300001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'board_elements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'board_id',
            type: 'uuid',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '30',
          },
          {
            name: 'data',
            type: 'jsonb',
          },
          {
            name: 'z_index',
            type: 'integer',
            default: 0,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
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
        columnNames: ["board_id"],
        referencedTableName: "boards",
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
    await queryRunner.dropTable('board_elements');
  }
}