import { DataSource } from 'typeorm';

export async function seedProductCategories(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository('product_categories');

  const categories = [
    {
      group_type: 'beverage_crops',
      name: 'Coffee',
      slug: 'coffee',
      code: 'BEV-COF',
      description: 'Green coffee beans, roasted coffee, specialty grades',
      attribute_schema: JSON.stringify({
        variety: { type: 'enum', options: ['Arabica', 'Robusta', 'Liberica'] },
        grade: { type: 'enum', options: ['AA', 'AB', 'PB', 'C', 'TT', 'T', 'UG'] },
        altitude: { type: 'number', unit: 'masl' },
        processing: { type: 'enum', options: ['Washed', 'Natural', 'Honey', 'Anaerobic'] },
        screen_size: { type: 'number', unit: 'mm' },
        moisture_content: { type: 'number', unit: '%', max: 12 },
        defect_count: { type: 'number', unit: 'per 300g' },
        cupping_score: { type: 'number', min: 0, max: 100 },
        origin_region: { type: 'text' },
        harvest_year: { type: 'number' },
      }),
    },
    {
      group_type: 'beverage_crops',
      name: 'Tea',
      slug: 'tea',
      code: 'BEV-TEA',
      description: 'Black tea, green tea, white tea, oolong, specialty teas',
      attribute_schema: JSON.stringify({
        type: { type: 'enum', options: ['Black', 'Green', 'White', 'Oolong', 'Pu-erh', 'Purple'] },
        grade: { type: 'enum', options: ['OP', 'BOP', 'FOP', 'TGFOP', 'FTGFOP', 'Dust'] },
        origin: { type: 'text' },
        elevation: { type: 'number', unit: 'masl' },
        harvest_season: { type: 'enum', options: ['First Flush', 'Second Flush', 'Autumnal', 'Monsoon'] },
        caffeine_content: { type: 'number', unit: 'mg/L' },
        organic_certified: { type: 'boolean' },
      }),
    },
    {
      group_type: 'beverage_crops',
      name: 'Cocoa',
      slug: 'cocoa',
      code: 'BEV-COC',
      description: 'Cocoa beans, cocoa butter, cocoa powder, specialty cacao',
      attribute_schema: JSON.stringify({
        bean_type: { type: 'enum', options: ['Criollo', 'Forastero', 'Trinitario'] },
        grade: { type: 'enum', options: ['Fine/Flavor', 'Bulk'] },
        fermentation_rate: { type: 'number', unit: '%' },
        moisture: { type: 'number', unit: '%', max: 7.5 },
        bean_count: { type: 'number', unit: 'per 100g' },
        origin_country: { type: 'text' },
        harvest_year: { type: 'number' },
        organic_certified: { type: 'boolean' },
        fair_trade_certified: { type: 'boolean' },
      }),
    },
    {
      group_type: 'spices_botanicals',
      name: 'Vanilla',
      slug: 'vanilla',
      code: 'SPB-VAN',
      description: 'Vanilla beans, extract, powder — Madagascar, Uganda, Tanzania',
      attribute_schema: JSON.stringify({
        variety: { type: 'enum', options: ['Bourbon', 'Tahitian', 'Mexican'] },
        length: { type: 'number', unit: 'cm' },
        moisture: { type: 'number', unit: '%' },
        vanillin_content: { type: 'number', unit: '%', min: 1.5 },
        origin: { type: 'text' },
        grade: { type: 'enum', options: ['Grade A', 'Grade B', 'Grade C'] },
      }),
    },
    {
      group_type: 'spices_botanicals',
      name: 'Saffron',
      slug: 'saffron',
      code: 'SPB-SAF',
      description: 'Saffron threads, powder — premium spice',
      attribute_schema: JSON.stringify({
        grade: { type: 'enum', options: ['Negin', 'Sargol', 'Pushal', 'Dasteh'] },
        crocin_content: { type: 'number', unit: '%', min: 200 },
        origin: { type: 'text' },
        moisture: { type: 'number', unit: '%', max: 8 },
      }),
    },
    {
      group_type: 'dry_commodities',
      name: 'Cashew Nuts',
      slug: 'cashew-nuts',
      code: 'DRY-CAS',
      description: 'Raw cashew nuts, kernels, roasted, specialty grades',
      attribute_schema: JSON.stringify({
        grade: { type: 'enum', options: ['W320', 'W240', 'W180', 'WS', 'LP', 'SP', 'BB'] },
        kernel_count: { type: 'number', unit: 'per lb' },
        moisture: { type: 'number', unit: '%', max: 5 },
        broken_percentage: { type: 'number', unit: '%', max: 5 },
        origin: { type: 'text' },
        organic_certified: { type: 'boolean' },
      }),
    },
    {
      group_type: 'dry_commodities',
      name: 'Sesame Seeds',
      slug: 'sesame-seeds',
      code: 'DRY-SES',
      description: 'White sesame, brown sesame, hulled, natural',
      attribute_schema: JSON.stringify({
        color: { type: 'enum', options: ['White', 'Brown', 'Black', 'Mixed'] },
        purity: { type: 'number', unit: '%', min: 99 },
        oil_content: { type: 'number', unit: '%', min: 48 },
        moisture: { type: 'number', unit: '%', max: 6 },
        admixture: { type: 'number', unit: '%', max: 1 },
        origin: { type: 'text' },
        organic_certified: { type: 'boolean' },
      }),
    },
    {
      group_type: 'fresh_produce',
      name: 'Avocado',
      slug: 'avocado',
      code: 'FRH-AVO',
      description: 'Hass avocado, Fuerte, Pinkerton — fresh export quality',
      attribute_schema: JSON.stringify({
        variety: { type: 'enum', options: ['Hass', 'Fuerte', 'Pinkerton', 'Reed', 'Zutano'] },
        size: { type: 'enum', options: ['16', '18', '20', '22', '24', '28', '32', '36', '40', '48'] },
        dry_matter: { type: 'number', unit: '%', min: 21 },
        oil_content: { type: 'number', unit: '%' },
        ripeness: { type: 'enum', options: ['Hard Green', 'Breaking', 'Firm Ripe', 'Ripe'] },
        origin: { type: 'text' },
        organic_certified: { type: 'boolean' },
        fair_trade_certified: { type: 'boolean' },
      }),
    },
    {
      group_type: 'fresh_produce',
      name: 'Mango',
      slug: 'mango',
      code: 'FRH-MAN',
      description: 'Fresh mangoes — Kent, Tommy Atkins, Keitt, Alphonso',
      attribute_schema: JSON.stringify({
        variety: { type: 'enum', options: ['Kent', 'Tommy Atkins', 'Keitt', 'Alphonso', 'Ataulfo', 'Dasheri'] },
        size: { type: 'enum', options: ['4', '5', '6', '7', '8', '9', '10', '12'] },
        brix: { type: 'number', unit: 'degrees', min: 10 },
        origin: { type: 'text' },
        organic_certified: { type: 'boolean' },
      }),
    },
    {
      group_type: 'processed_products',
      name: 'Shea Butter',
      slug: 'shea-butter',
      code: 'PRO-SHB',
      description: 'Raw shea butter, refined shea butter, organic certified',
      attribute_schema: JSON.stringify({
        grade: { type: 'enum', options: ['Grade A (Raw/Unrefined)', 'Grade B (Refined)', 'Grade C (Highly Refined)'] },
        saponification_value: { type: 'number', unit: 'mg KOH/g' },
        iodine_value: { type: 'number', unit: 'g I2/100g' },
        moisture: { type: 'number', unit: '%', max: 0.5 },
        origin: { type: 'text' },
        organic_certified: { type: 'boolean' },
        fair_trade_certified: { type: 'boolean' },
      }),
    },
    {
      group_type: 'animal_products',
      name: 'Honey',
      slug: 'honey',
      code: 'ANP-HON',
      description: 'Raw honey, organic honey, monofloral, multifloral',
      attribute_schema: JSON.stringify({
        floral_source: { type: 'enum', options: ['Multifloral', 'Acacia', 'Eucalyptus', 'Clover', 'Manuka', 'Citrus', 'Coffee', 'Avocado'] },
        moisture: { type: 'number', unit: '%', max: 18.5 },
        hmf: { type: 'number', unit: 'mg/kg', max: 40 },
        diastase_activity: { type: 'number', unit: 'Schade units', min: 8 },
        origin: { type: 'text' },
        organic_certified: { type: 'boolean' },
        fair_trade_certified: { type: 'boolean' },
      }),
    },
  ];

  for (const cat of categories) {
    await repo.upsert(cat, ['slug']);
  }

  console.log(`Seeded ${categories.length} product categories`);
}

export async function seedComplianceRules(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository('compliance_rules');

  const rules = [
    {
      origin_country: 'KE',
      destination_country: 'US',
      requirement_type: 'document',
      requirement: 'Phytosanitary Certificate (PPQ Form 577)',
      description: 'Required by USDA APHIS for all plant products entering the United States. Must be issued by Kenya Plant Health Inspectorate Service (KEPHIS).',
      responsible_party: 'exporter',
      issuing_authority: 'KEPHIS',
      issuing_authority_country: 'KE',
      estimated_time_days: 3,
      estimated_cost_usd: 75,
      validity_period: '30 days from issuance',
      verification_method: 'Verify certificate number via KEPHIS online portal',
      required_document_type: 'phytosanitary_certificate',
      source_url: 'https://www.aphis.usda.gov/import_export/plants/',
      rule_status: 'active',
    },
    {
      origin_country: 'KE',
      destination_country: 'US',
      requirement_type: 'certification',
      requirement: 'USDA NOP Organic Certification (if labeled organic)',
      description: 'If product is marketed as organic in the US, it must comply with USDA National Organic Program standards. Kenyan certifier must be USDA-accredited.',
      responsible_party: 'exporter',
      issuing_authority: 'USDA NOP / Accredited certifying agent',
      estimated_time_days: 90,
      estimated_cost_usd: 2500,
      validity_period: 'Annual renewal required',
      required_document_type: 'organic_certificate',
      rule_status: 'active',
    },
    {
      origin_country: 'KE',
      destination_country: 'US',
      requirement_type: 'inspection',
      requirement: 'FDA Prior Notice and Inspection',
      description: 'All food imports must have FDA prior notice filed before arrival. FDA may conduct physical inspection, sampling, or detain shipment.',
      responsible_party: 'importer',
      issuing_authority: 'FDA',
      estimated_time_days: 1,
      estimated_cost_usd: 0,
      verification_method: 'File via FDA Prior Notice System Interface (PNSI)',
      rule_status: 'active',
    },
    {
      origin_country: 'KE',
      destination_country: 'US',
      requirement_type: 'document',
      requirement: 'Certificate of Origin',
      description: 'Required for customs valuation and to claim duty benefits under AGOA. Must be issued by authorized chamber of commerce.',
      responsible_party: 'exporter',
      issuing_authority: 'Kenya National Chamber of Commerce and Industry',
      estimated_time_days: 1,
      estimated_cost_usd: 25,
      required_document_type: 'certificate_of_origin',
      rule_status: 'active',
    },
    {
      origin_country: 'KE',
      destination_country: 'US',
      requirement_type: 'document',
      requirement: 'Commercial Invoice and Packing List',
      description: 'Required by CBP for all commercial shipments. Must include detailed description, quantities, values, HS codes.',
      responsible_party: 'exporter',
      estimated_time_days: 0,
      estimated_cost_usd: 0,
      required_document_type: 'invoice',
      rule_status: 'active',
    },
    {
      origin_country: 'KE',
      destination_country: 'DE',
      requirement_type: 'document',
      requirement: 'EUR.1 Movement Certificate',
      description: 'Required to claim preferential tariff treatment under EU-EAC EPA. Must be issued by customs authority or authorized body.',
      responsible_party: 'exporter',
      issuing_authority: 'Kenya Revenue Authority (KRA)',
      estimated_time_days: 1,
      estimated_cost_usd: 15,
      validity_period: '4 months from issuance',
      required_document_type: 'certificate_of_origin',
      rule_status: 'active',
    },
    {
      origin_country: 'KE',
      destination_country: 'DE',
      requirement_type: 'certification',
      requirement: 'EU Organic Regulation (EU) 2018/848',
      description: 'Organic products exported to EU must comply with EU organic regulation. Kenyan control body must be EU-recognized.',
      responsible_party: 'exporter',
      estimated_time_days: 90,
      estimated_cost_usd: 3000,
      validity_period: 'Annual',
      required_document_type: 'organic_certificate',
      rule_status: 'active',
    },
    {
      origin_country: 'KE',
      destination_country: 'DE',
      requirement_type: 'inspection',
      requirement: 'EU Border Control Post (BCP) Inspection',
      description: 'All food of non-animal origin from third countries may be subject to documentary, identity, and physical checks at EU BCP.',
      responsible_party: 'importer',
      estimated_time_days: 1,
      estimated_cost_usd: 150,
      rule_status: 'active',
    },
  ];

  for (const rule of rules) {
    await repo.upsert(rule, ['origin_country', 'destination_country', 'requirement_type', 'requirement', 'rule_version']);
  }

  console.log(`Seeded ${rules.length} compliance rules`);
}

export async function runSeed(dataSource: DataSource): Promise<void> {
  await seedProductCategories(dataSource);
  await seedComplianceRules(dataSource);
  console.log('Seed complete');
}
