import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

/**
 * Partition Maintenance Service
 * 
 * Automatically creates new partitions for time-series tables
 * on the first day of each month. Prevents hard failures when
 * partitioned tables receive inserts beyond existing partitions.
 */
@Injectable()
export class PartitionMaintenanceService {
  private readonly logger = new Logger(PartitionMaintenanceService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async createMonthlyPartitions(): Promise<void> {
    this.logger.log('Running monthly partition creation');
    
    try {
      await this.dataSource.query('SELECT create_message_partition()');
      this.logger.log('Created messages partition for next month');
    } catch (error) {
      this.logger.error('Failed to create messages partition', error);
    }

    try {
      await this.dataSource.query('SELECT create_audit_log_partition()');
      this.logger.log('Created audit_logs partition for next month');
    } catch (error) {
      this.logger.error('Failed to create audit_logs partition', error);
    }
  }

  /**
   * Check partition headroom and alert if fewer than 2 future partitions exist.
   * Called weekly as a safety net.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async checkPartitionHeadroom(): Promise<void> {
    this.logger.log('Checking partition headroom');

    const tables = ['messages', 'audit_logs'];
    
    for (const table of tables) {
      const result = await this.dataSource.query(`
        SELECT COUNT(*) as count 
        FROM pg_tables 
        WHERE tablename LIKE '${table}_%'
          AND tablename > '${table}_' || TO_CHAR(NOW(), 'YYYY_MM')
      `);

      const futurePartitions = parseInt(result[0]?.count || '0', 10);
      
      if (futurePartitions < 2) {
        this.logger.warn(
          `Partition headroom low for ${table}: ${futurePartitions} future partitions remaining`
        );
      }
    }
  }
}
