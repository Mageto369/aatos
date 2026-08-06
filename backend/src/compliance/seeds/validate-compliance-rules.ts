/**
 * Compliance Rule Validation Script
 * 
 * Validates the Kenya → US green coffee compliance rule set against
 * the AATOS compliance module requirements.
 * 
 * Usage:
 *   npx ts-node src/compliance/seeds/validate-compliance-rules.ts
 */

import { DataSource } from 'typeorm';
import { ComplianceRule } from '../entities/compliance-rule.entity';

interface ValidationResult {
  rule: ComplianceRule;
  checks: { name: string; passed: boolean; message?: string }[];
  overall: 'PASS' | 'FAIL' | 'WARN';
}

const REQUIRED_SOURCE_URLS = [
  'KEPHIS',
  'AFA',
  'FDA',
  'CBP',
  'USDA',
  'APHIS',
  'USTR',
  'KRA',
  'HTS',
];

async function validate() {
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

  console.log('=== AATOS Compliance Rule Validation ===\n');
  console.log('Scope: Kenya → United States, Green Specialty Coffee\n');

  // Fetch all KE→US rules
  const rules = await repo.find({
    where: { originCountry: 'KE', destinationCountry: 'US' },
  });

  if (rules.length === 0) {
    console.error('ERROR: No KE→US compliance rules found in database.');
    console.error('Run seed script first: npx ts-node seed-compliance-rules.ts\n');
    await ds.destroy();
    process.exit(1);
  }

  console.log(`Found ${rules.length} rules to validate.\n`);

  const results: ValidationResult[] = [];

  for (const rule of rules) {
    const checks: ValidationResult['checks'] = [];

    // Check 1: Required fields present
    checks.push({
      name: 'Required fields populated',
      passed: !!(rule.requirement && rule.responsibleParty && rule.requirementType),
      message: !rule.requirement ? 'Missing requirement text' : 
               !rule.responsibleParty ? 'Missing responsible party' :
               !rule.requirementType ? 'Missing requirement type' : undefined,
    });

    // Check 2: Valid country codes
    checks.push({
      name: 'Valid country codes (ISO 3166-1 alpha-2)',
      passed: rule.originCountry === 'KE' && rule.destinationCountry === 'US',
      message: rule.originCountry !== 'KE' ? `Invalid origin: ${rule.originCountry}` :
               rule.destinationCountry !== 'US' ? `Invalid destination: ${rule.destinationCountry}` : undefined,
    });

    // Check 3: Source attribution
    checks.push({
      name: 'Source attribution present',
      passed: !!(rule.sourceName || rule.sourceUrl),
      message: !rule.sourceName && !rule.sourceUrl ? 'No source name or URL' : undefined,
    });

    // Check 4: Source URL valid format (if present)
    if (rule.sourceUrl) {
      const urlValid = rule.sourceUrl.startsWith('http://') || rule.sourceUrl.startsWith('https://');
      checks.push({
        name: 'Source URL format valid',
        passed: urlValid,
        message: !urlValid ? `Invalid URL format: ${rule.sourceUrl}` : undefined,
      });
    }

    // Check 5: Cost estimate present for fee/tax/permit/certification
    const costExpected = ['fee', 'tax', 'permit', 'certification', 'inspection', 'laboratory_test'].includes(rule.requirementType);
    checks.push({
      name: 'Cost estimate present (where applicable)',
      passed: !costExpected || rule.estimatedCostUsd !== null,
      message: costExpected && rule.estimatedCostUsd === null ? 'Missing cost estimate' : undefined,
    });

    // Check 6: Timeline estimate present
    checks.push({
      name: 'Timeline estimate present',
      passed: rule.estimatedTimeDays !== null || ['registration', 'document'].includes(rule.requirementType) === false,
      message: rule.estimatedTimeDays === null && !['registration', 'document'].includes(rule.requirementType) ? 'Missing timeline estimate' : undefined,
    });

    // Check 7: Responsible party valid
    const validParties = ['exporter', 'importer', 'carrier', 'platform'];
    checks.push({
      name: 'Responsible party valid',
      passed: validParties.includes(rule.responsibleParty),
      message: !validParties.includes(rule.responsibleParty) ? `Unknown party: ${rule.responsibleParty}` : undefined,
    });

    // Check 8: Description meaningful
    checks.push({
      name: 'Description meaningful (>20 chars)',
      passed: (rule.description?.length || 0) > 20,
      message: (rule.description?.length || 0) <= 20 ? 'Description too short or missing' : undefined,
    });

    // Determine overall
    const failures = checks.filter(c => !c.passed);
    const warnings = checks.filter(c => c.passed && c.message);
    
    if (failures.length > 0) {
      results.push({ rule, checks, overall: 'FAIL' });
    } else if (warnings.length > 0) {
      results.push({ rule, checks, overall: 'WARN' });
    } else {
      results.push({ rule, checks, overall: 'PASS' });
    }
  }

  // Print results
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const result of results) {
    const icon = result.overall === 'PASS' ? '✓' : result.overall === 'WARN' ? '⚠' : '✗';
    const req = result.rule.requirement.substring(0, 60);
    console.log(`${icon} [${result.overall}] ${req}${result.rule.requirement.length > 60 ? '...' : ''}`);
    
    if (result.overall !== 'PASS') {
      for (const check of result.checks) {
        if (!check.passed || check.message) {
          console.log(`    ${check.passed ? '⚠' : '✗'} ${check.name}${check.message ? `: ${check.message}` : ''}`);
        }
      }
    }

    if (result.overall === 'PASS') passCount++;
    else if (result.overall === 'WARN') warnCount++;
    else failCount++;
  }

  console.log('\n=== Summary ===');
  console.log(`Total rules:     ${results.length}`);
  console.log(`PASS:            ${passCount}`);
  console.log(`WARN:            ${warnCount}`);
  console.log(`FAIL:            ${failCount}`);
  console.log(`Success rate:    ${Math.round((passCount / results.length) * 100)}%`);

  // Structural checks
  console.log('\n=== Structural Checks ===');
  
  const requiredTypes = ['document', 'inspection', 'certification', 'permit', 'registration', 'tax'];
  const foundTypes = new Set(rules.map(r => r.requirementType));
  const missingTypes = requiredTypes.filter(t => !foundTypes.has(t));
  console.log(`Required requirement types present: ${missingTypes.length === 0 ? 'YES' : 'NO'}`);
  if (missingTypes.length > 0) {
    console.log(`  Missing: ${missingTypes.join(', ')}`);
  }

  const hasExporterRules = rules.some(r => r.responsibleParty === 'exporter');
  const hasImporterRules = rules.some(r => r.responsibleParty === 'importer');
  console.log(`Exporter rules present: ${hasExporterRules ? 'YES' : 'NO'}`);
  console.log(`Importer rules present: ${hasImporterRules ? 'YES' : 'NO'}`);

  const sourceCoverage = rules.filter(r => r.sourceUrl && r.sourceName).length;
  console.log(`Full source attribution: ${sourceCoverage}/${rules.length} (${Math.round((sourceCoverage/rules.length)*100)}%)`);

  console.log('\n=== Corridor Coverage ===');
  console.log(`Kenyan origin rules: ${rules.filter(r => r.responsibleParty === 'exporter').length}`);
  console.log(`U.S. destination rules: ${rules.filter(r => r.responsibleParty === 'importer').length}`);
  console.log(`Commercial documentation: ${rules.filter(r => r.responsibleParty === 'exporter' && r.requirementType === 'document').length}`);

  await ds.destroy();

  // Exit code
  if (failCount > 0) {
    console.log('\nValidation FAILED. Fix errors before deployment.\n');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('\nValidation PASSED with warnings. Review warnings.\n');
    process.exit(0);
  } else {
    console.log('\nValidation PASSED. All rules meet standards.\n');
    process.exit(0);
  }
}

validate().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
