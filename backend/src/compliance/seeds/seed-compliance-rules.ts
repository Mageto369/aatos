/**
 * Compliance Rule Seeder
 * 
 * Usage:
 *   npx ts-node src/compliance/seeds/seed-compliance-rules.ts
 * 
 * Environment:
 *   Requires DATABASE_URL or DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME
 */

import { DataSource } from 'typeorm';
import { ComplianceRule } from '../entities/compliance-rule.entity';
import { kenyaUsGreenCoffeeRules } from './kenya-us-green-coffee.rules';

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'aatos_user',
    password: process.env.DB_PASSWORD || 'aatos_pass',
    database: process.env.DB_NAME || 'aatos_dev',
    entities: [ComplianceRule],
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  const repo = ds.getRepository(ComplianceRule);

  console.log('=== AATOS Compliance Rule Seeder ===\n');

  // Check existing rules for this corridor
  const existing = await repo.find({
    where: { originCountry: 'KE', destinationCountry: 'US' },
  });

  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing KE→US rules.`);
    console.log('Options:');
    console.log('  1. Skip (keep existing)');
    console.log('  2. Replace (delete existing, insert new)');
    console.log('  3. Append (insert new, may create duplicates)\n');
    
    // Default to replace in non-interactive environments
    const action = process.env.SEED_ACTION || 'replace';
    console.log(`Action (from SEED_ACTION env): ${action}\n`);

    if (action === 'replace') {
      await repo.remove(existing);
      console.log(`Deleted ${existing.length} existing rules.`);
    } else if (action === 'skip') {
      console.log('Skipping. No changes made.');
      await ds.destroy();
      return;
    }
    // append = do nothing, just insert
  }

  // Insert new rules
  const rules = kenyaUsGreenCoffeeRules.map(r => repo.create(r));
  const saved = await repo.save(rules);

  console.log(`Inserted ${saved.length} compliance rules.\n`);

  // Summary
  const byType = saved.reduce((acc, r) => {
    acc[r.requirementType] = (acc[r.requirementType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Breakdown by requirement type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\nRules seeded successfully.');
  await ds.destroy();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
