import { MigrationInterface, QueryRunner } from "typeorm";

// entity_id was varchar(60). Room member actions log the composite key "roomId:userId",
// which is 36 + 1 + 36 = 73 characters, so the audit insert failed with a 500.
// A new migration (instead of editing 1800000100000) also fixes databases that already ran the old one.
// Plain ALTER COLUMN TYPE keeps the existing values (TypeORM's changeColumn would drop and re-add the column).
export class WidenAuditEntityId1800000100001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "entity_id" TYPE varchar(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Cut longer values to 60 so the rollback cannot fail
        await queryRunner.query(
            `ALTER TABLE "audit_logs" ALTER COLUMN "entity_id" TYPE varchar(60) USING left("entity_id", 60)`,
        );
    }
}
