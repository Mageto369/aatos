/**
 * Schema Drift Detector
 *
 * Runs the migrations against a real database, then asserts that every column
 * TypeORM will actually query exists in the resulting schema.
 *
 * The check is deliberately strict about column names. TypeORM issues SQL
 * using `column.databaseName`, which is the `name:` given in the @Column
 * options, or the property name verbatim when none is given — the default
 * naming strategy does not convert camelCase to snake_case. So an entity
 * written as
 *
 *     @Column({ type: 'text', array: true })
 *     imageUrls: string[];
 *
 * against a migration that created `image_urls` will emit `"imageUrls"` and
 * fail at runtime with `column "imageUrls" of relation "products" does not
 * exist`. An earlier version of this detector retried each miss under a
 * camelCase-to-snake_case conversion and reported no drift, which is why 21
 * such columns across audit_logs, disputes, messages, products and
 * refresh_tokens reached main undetected. Comparing against databaseName only
 * is the entire value of this script; do not add a fallback.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx ts-node -r tsconfig-paths/register \
 *     src/database/drift-detector-db.ts
 *
 * Exits 0 when the schema matches, 1 on drift or on failure to run.
 */

import { DataSource } from 'typeorm';
import * as path from 'path';

async function detectDrift(): Promise<number> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required.');
    return 1;
  }

  const ds = new DataSource({
    type: 'postgres',
    url,
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  });

  await ds.initialize();

  try {
    await ds.runMigrations();

    const queryRunner = ds.createQueryRunner();
    const issues: string[] = [];

    try {
      const tables = (await queryRunner.getTables()).filter((t) => t.schema === 'public');
      const byName = new Map(tables.map((t) => [t.name, t]));

      for (const entity of ds.entityMetadatas) {
        const table = byName.get(entity.tableName);
        if (!table) {
          issues.push(`${entity.name}: table "${entity.tableName}" does not exist`);
          continue;
        }

        const columns = new Map(table.columns.map((c) => [c.name, c]));
        for (const column of entity.columns) {
          const dbColumn = columns.get(column.databaseName);
          if (!dbColumn) {
            issues.push(
              `${entity.tableName}.${column.propertyName}: entity queries ` +
                `"${column.databaseName}", which does not exist on the table`,
            );
            continue;
          }

          // Array-ness has to match too. A column declared `simple-array` is
          // serialised by TypeORM as a comma-joined string, so writing it to a
          // native Postgres text[] fails with `malformed array literal`. That
          // shape of bug is invisible to a name-only check: it broke
          // notifications.channels, inspections.photos, inspections.videos and
          // documents.tags, and because notifyDealCreated runs inside the
          // onQuoteAccepted transaction it rolled back every deal the platform
          // ever tried to create.
          if (dbColumn.isArray !== column.isArray) {
            issues.push(
              `${entity.tableName}.${column.propertyName}: entity declares ` +
                `${column.isArray ? 'an array' : 'a scalar'} but the column is ` +
                `${dbColumn.isArray ? 'an array' : 'a scalar'}` +
                (column.type === 'simple-array'
                  ? " — 'simple-array' writes a comma-joined string; use { type: 'text', array: true }"
                  : ''),
            );
          }
        }
      }

      // Tables present in the database with no entity behind them. Partitions
      // and views are legitimate, so resolve them from the catalogue rather
      // than from a hardcoded list that goes stale as partitions roll forward.
      const partitions: Array<{ name: string }> = await queryRunner.query(
        `SELECT c.relname AS name
           FROM pg_class c
           JOIN pg_inherits i ON i.inhrelid = c.oid`,
      );
      const views: Array<{ table_name: string }> = await queryRunner.query(
        `SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_type = 'VIEW'`,
      );

      const ignored = new Set<string>([
        'migrations',
        ...partitions.map((p) => p.name),
        ...views.map((v) => v.table_name),
      ]);
      const entityTables = new Set(ds.entityMetadatas.map((e) => e.tableName));

      for (const table of tables) {
        if (ignored.has(table.name) || entityTables.has(table.name)) continue;
        issues.push(`table "${table.name}" exists but no entity maps to it`);
      }
    } finally {
      await queryRunner.release();
    }

    if (issues.length === 0) {
      console.log(
        `No schema drift: ${ds.entityMetadatas.length} entities match the migrated schema.`,
      );
      return 0;
    }

    console.error(`Schema drift — ${issues.length} issue(s):\n`);
    for (const issue of issues) console.error(`  ${issue}`);
    console.error(
      '\nEach of these fails at runtime the first time the column is read or written.',
    );
    return 1;
  } finally {
    await ds.destroy();
  }
}

detectDrift()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Drift detection failed to run:', err);
    process.exit(1);
  });
