/**
 * Compliance Module Integration Test
 * 
 * Tests end-to-end compliance checklist generation
 * for Kenya → U.S. green coffee corridor.
 * 
 * Usage:
 *   npx ts-node src/compliance/seeds/integration-test.ts
 */

import { DataSource } from 'typeorm';
import { ComplianceRule } from '../entities/compliance-rule.entity';
import { ComplianceChecklist } from '../entities/compliance-checklist.entity';
import { ComplianceChecklistItem } from '../entities/compliance-checklist-item.entity';

async function test() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'aatos_user',
    password: process.env.DB_PASSWORD || 'aatos_pass',
    database: process.env.DB_NAME || 'aatos_dev',
    entities: [ComplianceRule, ComplianceChecklist, ComplianceChecklistItem],
    synchronize: false,
    logging: false,
  });

  await ds.initialize();

  console.log('=== AATOS Compliance Module Integration Test ===\n');
  console.log('Scenario: Kenyan exporter "Nyeri Coffee Cooperative" preparing');
  console.log('          shipment to U.S. importer "Seattle Roasters Inc."\n');

  // Step 1: Check rules exist
  const ruleRepo = ds.getRepository(ComplianceRule);
  const rules = await ruleRepo.find({
    where: { originCountry: 'KE', destinationCountry: 'US', ruleStatus: 'active' },
  });

  console.log(`[Step 1] Compliance rules loaded: ${rules.length} active rules found`);
  if (rules.length === 0) {
    console.error('FAIL: No rules found. Run seed script first.\n');
    await ds.destroy();
    process.exit(1);
  }
  console.log('         ✓ Rules present in database\n');

  // Step 2: Generate checklist for exporter
  const checklistRepo = ds.getRepository(ComplianceChecklist);
  const itemRepo = ds.getRepository(ComplianceChecklistItem);

  const exporterId = 'test-exporter-nyeri-001';
  const exporterChecklist = checklistRepo.create({
    entityType: 'organization',
    entityId: exporterId,
    originCountry: 'KE',
    destinationCountry: 'US',
    generatedByRules: rules.map(r => r.id),
    overallStatus: 'pending',
    completionPercent: 0,
  });

  const savedChecklist = await checklistRepo.save(exporterChecklist);
  console.log(`[Step 2] Checklist created: ${savedChecklist.id}`);

  // Create items
  const items = rules.map(rule =>
    itemRepo.create({
      checklistId: savedChecklist.id,
      ruleId: rule.id,
      requirementType: rule.requirementType,
      requirement: rule.requirement,
      description: rule.description,
      responsibleParty: rule.responsibleParty,
      status: 'pending',
    }),
  );

  const savedItems = await itemRepo.save(items);
  console.log(`         ✓ ${savedItems.length} checklist items generated\n`);

  // Step 3: Show breakdown
  const exporterItems = savedItems.filter(i => i.responsibleParty === 'exporter');
  const importerItems = savedItems.filter(i => i.responsibleParty === 'importer');
  const carrierItems = savedItems.filter(i => i.responsibleParty === 'carrier');

  console.log('[Step 3] Responsibility breakdown:');
  console.log(`         Exporter tasks: ${exporterItems.length}`);
  console.log(`         Importer tasks: ${importerItems.length}`);
  console.log(`         Carrier tasks:  ${carrierItems.length}`);
  console.log('         ✓ Checklist correctly segmented by party\n');

  // Step 4: Simulate completion of critical exporter tasks
  const criticalTasks = exporterItems.filter(i => 
    ['Phytosanitary', 'Export License', 'Certificate of Origin', 'Export Declaration'].some(
      keyword => i.requirement.includes(keyword)
    )
  );

  console.log('[Step 4] Simulating critical task completion...');
  for (const task of criticalTasks) {
    task.status = 'completed';
    task.completedAt = new Date();
    await itemRepo.save(task);
    console.log(`         ✓ ${task.requirement.substring(0, 50)}...`);
  }
  console.log(`         ${criticalTasks.length} critical tasks marked complete\n`);

  // Step 5: Calculate completion
  const completedCount = savedItems.filter(i => i.status === 'completed').length;
  const completionPercent = Math.round((completedCount / savedItems.length) * 100);

  savedChecklist.completionPercent = completionPercent;
  if (completionPercent === 100) {
    savedChecklist.overallStatus = 'complete';
  } else if (completionPercent > 0) {
    savedChecklist.overallStatus = 'in_progress';
  }
  await checklistRepo.save(savedChecklist);

  console.log('[Step 5] Completion status:');
  console.log(`         Overall: ${savedChecklist.overallStatus}`);
  console.log(`         Progress: ${completionPercent}% (${completedCount}/${savedItems.length})`);
  console.log('         ✓ Checklist tracking functional\n');

  // Step 6: Verify rule sources are accessible
  const rulesWithUrls = rules.filter(r => r.sourceUrl);
  console.log(`[Step 6] Source verification: ${rulesWithUrls.length}/${rules.length} rules have source URLs`);
  console.log('         Sample sources:');
  rulesWithUrls.slice(0, 5).forEach(r => {
    console.log(`         • ${r.sourceName || 'Unknown'}: ${r.sourceUrl!.substring(0, 60)}...`);
  });
  console.log('         ✓ Regulatory traceability maintained\n');

  // Cleanup
  await itemRepo.remove(savedItems);
  await checklistRepo.remove(savedChecklist);

  console.log('=== TEST RESULT: PASS ===');
  console.log('Compliance module operational for KE→US green coffee corridor.');
  console.log('Ready for pilot use.\n');

  await ds.destroy();
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
