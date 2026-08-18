import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartitionFunctionsAndPreCreatePartitions1723968000000 implements MigrationInterface {
    name = 'AddPartitionFunctionsAndPreCreatePartitions1723968000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create function to generate audit_logs partitions (mirrors create_message_partition)
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION create_audit_log_partition()
            RETURNS void AS $$
            DECLARE
                partition_date DATE;
                partition_name TEXT;
                start_date DATE;
                end_date DATE;
            BEGIN
                partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
                partition_name := 'audit_logs_' || TO_CHAR(partition_date, 'YYYY_MM');
                start_date := partition_date;
                end_date := partition_date + INTERVAL '1 month';
                EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
                               partition_name, start_date, end_date);
            END;
            $$ LANGUAGE plpgsql
        `);

        // Pre-create audit_logs partitions for Sep 2026 through Aug 2027
        const auditMonths = [
            { month: '2026_09', start: '2026-09-01', end: '2026-10-01' },
            { month: '2026_10', start: '2026-10-01', end: '2026-11-01' },
            { month: '2026_11', start: '2026-11-01', end: '2026-12-01' },
            { month: '2026_12', start: '2026-12-01', end: '2027-01-01' },
            { month: '2027_01', start: '2027-01-01', end: '2027-02-01' },
            { month: '2027_02', start: '2027-02-01', end: '2027-03-01' },
            { month: '2027_03', start: '2027-03-01', end: '2027-04-01' },
            { month: '2027_04', start: '2027-04-01', end: '2027-05-01' },
            { month: '2027_05', start: '2027-05-01', end: '2027-06-01' },
            { month: '2027_06', start: '2027-06-01', end: '2027-07-01' },
            { month: '2027_07', start: '2027-07-01', end: '2027-08-01' },
            { month: '2027_08', start: '2027-08-01', end: '2027-09-01' },
        ];

        for (const p of auditMonths) {
            await queryRunner.query(
                `CREATE TABLE IF NOT EXISTS audit_logs_${p.month} PARTITION OF audit_logs FOR VALUES FROM ('${p.start}') TO ('${p.end}')`
            );
        }

        // Pre-create messages partitions for Sep 2026 through Aug 2027
        const messageMonths = [
            { month: '2026_09', start: '2026-09-01', end: '2026-10-01' },
            { month: '2026_10', start: '2026-10-01', end: '2026-11-01' },
            { month: '2026_11', start: '2026-11-01', end: '2026-12-01' },
            { month: '2026_12', start: '2026-12-01', end: '2027-01-01' },
            { month: '2027_01', start: '2027-01-01', end: '2027-02-01' },
            { month: '2027_02', start: '2027-02-01', end: '2027-03-01' },
            { month: '2027_03', start: '2027-03-01', end: '2027-04-01' },
            { month: '2027_04', start: '2027-04-01', end: '2027-05-01' },
            { month: '2027_05', start: '2027-05-01', end: '2027-06-01' },
            { month: '2027_06', start: '2027-06-01', end: '2027-07-01' },
            { month: '2027_07', start: '2027-07-01', end: '2027-08-01' },
            { month: '2027_08', start: '2027-08-01', end: '2027-09-01' },
        ];

        for (const p of messageMonths) {
            await queryRunner.query(
                `CREATE TABLE IF NOT EXISTS messages_${p.month} PARTITION OF messages FOR VALUES FROM ('${p.start}') TO ('${p.end}')`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop pre-created partitions (newest first to avoid dependency issues)
        for (const month of ['2027_08', '2027_07', '2027_06', '2027_05', '2027_04', '2027_03', '2027_02', '2027_01', '2026_12', '2026_11', '2026_10', '2026_09']) {
            await queryRunner.query(`DROP TABLE IF EXISTS audit_logs_${month}`);
            await queryRunner.query(`DROP TABLE IF EXISTS messages_${month}`);
        }

        await queryRunner.query(`DROP FUNCTION IF EXISTS create_audit_log_partition()`);
    }
}
