/**
 * Schema Drift Detector
 * 
 * Compares entity files with the initial migration to detect discrepancies.
 * Does not require database connection.
 * 
 * Usage:
 *   npx ts-node src/database/schema-drift-detector.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const MIGRATION_FILE = path.join(__dirname, 'migrations', '1722720000000-InitialSchema.ts');
const ENTITIES_DIR = path.join(__dirname, '..');

interface Drift {
  entity: string;
  type: 'missing_in_migration' | 'missing_in_entity' | 'type_mismatch';
  field?: string;
  migrationType?: string;
  entityType?: string;
  detail: string;
}

function findEntityFiles(dir: string): string[] {
  const results: string[] = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      results.push(...findEntityFiles(fullPath));
    } else if (file.endsWith('.entity.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractEntityName(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Look for @Entity('table_name') or @Entity()
  const entityMatch = content.match(/@Entity\(['"]?([^'")]*)['"]?\)/);
  if (entityMatch && entityMatch[1]) return entityMatch[1];
  // Fallback: class name
  const classMatch = content.match(/export class (\w+)/);
  if (classMatch) {
    // Convert camelCase to snake_case
    return classMatch[1]
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
  return path.basename(filePath, '.entity.ts');
}

function extractEntityColumns(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const columns = new Map<string, string>();
  
  // Match @Column decorators and property names
  const columnRegex = /@Column\(([^)]*)\)\s*\n?\s*(\w+)[?:]\s*(\w+)/g;
  let match;
  while ((match = columnRegex.exec(content)) !== null) {
    const props = match[1];
    const propName = match[2];
    const tsType = match[3];
    
    // Convert property name to snake_case
    const snakeName = propName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase();
    
    // Determine DB type from TS type and Column props
    let dbType = 'unknown';
    if (tsType === 'string') dbType = 'varchar/text';
    else if (tsType === 'number') dbType = 'integer/decimal';
    else if (tsType === 'boolean') dbType = 'boolean';
    else if (tsType === 'Date') dbType = 'timestamp/date';
    
    if (props.includes('type:')) {
      const typeMatch = props.match(/type:\s*['"](\w+)['"]/);
      if (typeMatch) dbType = typeMatch[1];
    }
    
    columns.set(snakeName, dbType);
  }
  
  return columns;
}

function extractMigrationTable(migrationContent: string, tableName: string): Map<string, string> | null {
  const tableRegex = new RegExp(`CREATE TABLE ${tableName} \\(([^\\)]+)\\)`, 's');
  const match = migrationContent.match(tableRegex);
  if (!match) return null;
  
  const columns = new Map<string, string>();
  const lines = match[1].split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;
    if (trimmed.startsWith('CONSTRAINT') || trimmed.startsWith('UNIQUE') || trimmed.startsWith('PRIMARY') || trimmed.startsWith('FOREIGN')) continue;
    if (trimmed.startsWith('CREATE') || trimmed.startsWith(')')) continue;
    
    const colMatch = trimmed.match(/^(\w+)\s+(\w+(?:\([^)]*\))?)/);
    if (colMatch) {
      columns.set(colMatch[1].toLowerCase(), colMatch[2].toLowerCase());
    }
  }
  
  return columns;
}

function main() {
  console.log('=== AATOS Schema Drift Detector ===\n');
  
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error('Migration file not found:', MIGRATION_FILE);
    process.exit(1);
  }
  
  const migrationContent = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  const entityFiles = findEntityFiles(ENTITIES_DIR);
  
  console.log(`Found ${entityFiles.length} entity files\n`);
  
  const drifts: Drift[] = [];
  const tablesInMigration = new Set<string>();
  
  for (const entityFile of entityFiles) {
    const entityName = extractEntityName(entityFile);
    const tableName = entityName.toLowerCase();
    tablesInMigration.add(tableName);
    
    const entityColumns = extractEntityColumns(entityFile);
    const migrationColumns = extractMigrationTable(migrationContent, tableName);
    
    if (!migrationColumns) {
      drifts.push({
        entity: tableName,
        type: 'missing_in_migration',
        detail: `Table '${tableName}' not found in migration`,
      });
      continue;
    }
    
    // Check for columns in entity but not in migration
    for (const [colName, colType] of entityColumns) {
      if (!migrationColumns.has(colName)) {
        drifts.push({
          entity: tableName,
          type: 'missing_in_migration',
          field: colName,
          entityType: colType,
          detail: `Column '${colName}' in entity but missing in migration`,
        });
      }
    }
    
    // Check for columns in migration but not in entity
    for (const [colName, colType] of migrationColumns) {
      if (!entityColumns.has(colName) && colName !== 'id') {
        drifts.push({
          entity: tableName,
          type: 'missing_in_entity',
          field: colName,
          migrationType: colType,
          detail: `Column '${colName}' in migration but missing in entity`,
        });
      }
    }
  }
  
  // Report
  if (drifts.length === 0) {
    console.log('✓ No schema drift detected. Entities match migration.\n');
    process.exit(0);
  }
  
  console.log(`Found ${drifts.length} discrepancies:\n`);
  
  const byEntity = drifts.reduce((acc, d) => {
    acc[d.entity] = acc[d.entity] || [];
    acc[d.entity].push(d);
    return acc;
  }, {} as Record<string, Drift[]>);
  
  for (const [entity, entityDrifts] of Object.entries(byEntity)) {
    console.log(`Table: ${entity}`);
    for (const d of entityDrifts) {
      const icon = d.type === 'missing_in_migration' ? '✗' : d.type === 'missing_in_entity' ? '⚠' : '?';
      console.log(`  ${icon} ${d.detail}`);
    }
    console.log('');
  }
  
  console.log('=== Summary ===');
  console.log(`Missing in migration: ${drifts.filter(d => d.type === 'missing_in_migration').length}`);
  console.log(`Missing in entity:    ${drifts.filter(d => d.type === 'missing_in_entity').length}`);
  console.log(`Type mismatches:      ${drifts.filter(d => d.type === 'type_mismatch').length}`);
  console.log('\nAction needed: Generate a new migration to reconcile drift.\n');
  process.exit(1);
}

main();
