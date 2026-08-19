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
import { ProductCategory } from '../../products/entities/product-category.entity';
import { kenyaUsGreenCoffeeRules } from './kenya-us-green-coffee.rules';

async function seed() {
  // DATABASE_URL is what the app, the migrations and CI all use; the discrete
  // DB_* variables remain as a fallback.
  const ds = new DataSource({
    type: 'postgres',
    ...(process.env.DATABASE_URL
      ? { url: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'aatos_user',
          password: process.env.DB_PASSWORD || 'aatos_pass',
          database: process.env.DB_NAME || 'aatos_dev',
        }),
    entities: [ComplianceRule, ProductCategory],
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

  // The rule data identifies its commodity by slug ('green-coffee'), but
  // compliance_rules.product_category_id is a uuid — inserting the slug
  // directly fails in string_to_uuid, which is why this seeder has never
  // completed. Resolve each slug to the real category, leaving the column
  // null (the corridor rule still applies) when no such category exists.
  const categoryRepo = ds.getRepository(ProductCategory);
  const slugs = [...new Set(kenyaUsGreenCoffeeRules.map(r => r.productCategoryId).filter(Boolean))] as string[];
  const idBySlug = new Map<string, string>();

  for (const slug of slugs) {
    const category = await categoryRepo.findOne({ where: { slug } });
    if (category) {
      idBySlug.set(slug, category.id);
    } else {
      console.warn(`No product category with slug '${slug}'; those rules will be corridor-wide (category null).`);
    }
  }

  const rules = kenyaUsGreenCoffeeRules.map(r =>
    repo.create({
      ...r,
      productCategoryId: r.productCategoryId ? idBySlug.get(r.productCategoryId) ?? null : null,
    }),
  );
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
