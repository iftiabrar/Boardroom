import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMessagesTable1800000300002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'messages',
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
            name: 'sender_id',
            type: 'uuid',
            isNullable: true,
          },
          {
             name: 'body',
             type: 'text',
          },
          {
            name: 'is_edited',
            type: 'boolean',
            default: false,
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
        columnNames: ["sender_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      },
    ],

    indices: [
      {
        name: "IDX_MESSAGES_ROOM_CREATED_AT",
        columnNames: ["room_id", "created_at"],
      },
    ],
  }),
);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('messages');
  }
}