/**
 * Proper Schema Drift Detector
 * 
 * Compares actual database schema (after migrations) with TypeORM entities.
 * Uses TypeORM's internal metadata and query runner for accuracy.
 */

import { DataSource } from 'typeorm';
import * as path from 'path';

async function detectDrift() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'aatos_drift_test',
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, '..', '**', '*.entity.ts')],
    migrations: [path.join(__dirname, '..', 'database', 'migrations', '*.ts')],
  });

  await ds.initialize();

  console.log('=== AATOS Schema Drift Detector (Database-backed) ===\n');

  // Run all pending migrations
  console.log('Running migrations...');
  await ds.runMigrations();
  console.log('Migrations complete.\n');

  // Get actual database schema - filter to public schema only
  const queryRunner = ds.createQueryRunner();
  const dbTables = await queryRunner.getTables();
  const appTables = dbTables.filter(t => t.schema === 'public');

  // Get entity metadata
  const entityMetadatas = ds.entityMetadatas;

  const issues: string[] = [];

  for (const entityMeta of entityMetadatas) {
    const tableName = entityMeta.tableName;
    const dbTable = appTables.find(t => t.name === tableName);

    if (!dbTable) {
      issues.push(`Table '${tableName}' (entity: ${entityMeta.name}) NOT FOUND in database`);
      continue;
    }

    for (const column of entityMeta.columns) {
      const dbColumnName = column.databaseName; // TypeORM handles naming strategy
      const dbColumn = dbTable.columns.find(c => c.name === dbColumnName);
      if (!dbColumn) {
        // Try snake_case fallback
        const snakeName = column.propertyName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        const dbColumnSnake = dbTable.columns.find(c => c.name === snakeName);
        if (!dbColumnSnake) {
          issues.push(`Column '${column.propertyName}' (db: ${dbColumnName} or ${snakeName}) in entity ${entityMeta.name} MISSING from table ${tableName}`);
        }
      }
    }

    for (const relation of entityMeta.relations) {
      if (relation.foreignKeys && relation.foreignKeys.length > 0) {
        for (const fk of relation.foreignKeys) {
          const dbFk = dbTable.foreignKeys.find(
            f => f.columnNames.join(',') === fk.columnNames.join(',')
          );
          if (!dbFk) {
            issues.push(`Foreign key on '${fk.columnNames.join(',')}' in entity ${entityMeta.name} MISSING from table ${tableName}`);
          }
        }
      }
    }
  }

  // Check for tables in DB but not in entities (excluding known partition tables and views)
  const entityTableNames = new Set(entityMetadatas.map(e => e.tableName));
  const knownNonEntityTables = new Set([
    'migrations',
    'messages_2026_07', 'messages_2026_08', 'messages_2026_09',
    'audit_logs_2026_07', 'audit_logs_2026_08',
  ]);
  
  for (const dbTable of appTables) {
    if (dbTable.name === 'migrations') continue;
    if (knownNonEntityTables.has(dbTable.name)) continue;
    if (!entityTableNames.has(dbTable.name)) {
      // Skip views - they don't need entities
      const tableTypeResult = await queryRunner.query(
        `SELECT table_type FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [dbTable.name]
      );
      const tableType = tableTypeResult[0]?.table_type;
      if (tableType === 'VIEW') continue;
      issues.push(`Table '${dbTable.name}' EXISTS in database but NO ENTITY found`);
    }
  }

  await queryRunner.release();
  await ds.destroy();

  if (issues.length === 0) {
    console.log('✓ No schema drift detected. Database schema matches entities.\n');
    process.exit(0);
  }

  console.log(`Found ${issues.length} issue(s):\n`);
  for (const issue of issues) {
    console.log(`  ✗ ${issue}`);
  }
  console.log('\n');
  process.exit(1);
}

detectDrift().catch(err => {
  console.error('Drift detection failed:', err);
  process.exit(1);
});
