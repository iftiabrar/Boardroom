import { MigrationInterface, QueryRunner, Table } from "typeorm";



export class CreateUserTable1775500022201 implements MigrationInterface{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        await queryRunner.createTable(
            new Table(
                {
                    name:"users",
                    columns:[

                        {
                            name:"id",
                            type:"uuid",
                            isPrimary: true,
                            generationStrategy:"uuid",
                            default:"uuid_generate_v4()",
                        },
                        {
                            name:"name",
                            type:"varchar",
                            length: "30",
                            isNullable:false,
                        },

                         {
                            name:"email",
                            type:"varchar",
                            length: "100",
                            isNullable:false,
                            isUnique: true,
                        },
                         {
                            name:"password",
                            type:"varchar",
                            length: "255",
                            isNullable:false,
                        },
                        {
                            name: "role",
                            type: "varchar",
                            length: "20",
                            default: "'ROLE_USER'",
                        },
                        {
                            name: "is_active",
                            type: "boolean",
                            default: true,
                        },
                         {
                            name:"created_at",
                            type:"timestamp",
                            default:"CURRENT_TIMESTAMP(6)"
                        },
                         {
                            name:"updated_at",
                            type:"timestamp",
                            default:"CURRENT_TIMESTAMP(6)"
                        },

                    ],
                } ),
        );

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users");
    }
}