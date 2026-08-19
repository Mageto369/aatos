-- ═══════════════════════════════════════════════════════════════════════════════
-- AATOS — Seed Data for Development
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert product categories
INSERT INTO product_categories (id, name, slug, code, group_type, attribute_schema, description, sort_order) VALUES
('cat_coffee_arabica', 'Arabica Coffee', 'arabica-coffee', 'COF-ARAB', 'beverage_crops', '{
  "type": "object",
  "properties": {
    "variety": {"type": "string", "enum": ["Arabica", "Robusta"]},
    "grade": {"type": "string", "enum": ["AA", "AB", "PB", "C", "TT", "T"]},
    "processing": {"type": "string", "enum": ["washed", "natural", "honey"]},
    "crop_year": {"type": "integer", "minimum": 2020, "maximum": 2030},
    "cupping_score": {"type": "number", "minimum": 60, "maximum": 100},
    "moisture_content": {"type": "number", "minimum": 8, "maximum": 13},
    "defect_count": {"type": "integer", "minimum": 0},
    "screen_size": {"type": "string"}
  },
  "required": ["variety", "grade", "processing", "crop_year"]
}', 'High-quality Arabica coffee beans', 1),

('cat_coffee_robusta', 'Robusta Coffee', 'robusta-coffee', 'COF-ROB', 'beverage_crops', '{
  "type": "object",
  "properties": {
    "variety": {"type": "string", "enum": ["Robusta"]},
    "grade": {"type": "string", "enum": ["Screen 18", "Screen 15", "Screen 12"]},
    "processing": {"type": "string", "enum": ["washed", "natural"]},
    "crop_year": {"type": "integer"},
    "caffeine_content": {"type": "number"}
  }
}', 'Robusta coffee with higher caffeine content', 2),

('cat_sesame', 'Sesame Seeds', 'sesame-seeds', 'SES-WHT', 'dry_commodities', '{
  "type": "object",
  "properties": {
    "color": {"type": "string", "enum": ["white", "brown", "black"]},
    "purity": {"type": "number", "minimum": 95, "maximum": 100},
    "oil_content": {"type": "number", "minimum": 45, "maximum": 55},
    "moisture": {"type": "number", "minimum": 5, "maximum": 8},
    "foreign_matter": {"type": "number", "minimum": 0, "maximum": 2}
  }
}', 'Hulled and natural sesame seeds', 3),

('cat_cocoa', 'Cocoa Beans', 'cocoa-beans', 'CAC-BEA', 'beverage_crops', '{
  "type": "object",
  "properties": {
    "type": {"type": "string", "enum": ["Forastero", "Criollo", "Trinitario"]},
    "grade": {"type": "string", "enum": ["Grade 1", "Grade 2"]},
    "fermentation": {"type": "number", "minimum": 70, "maximum": 100},
    "moisture": {"type": "number", "minimum": 6, "maximum": 8}
  }
}', 'Fermented and dried cocoa beans', 4),

('cat_avocado', 'Avocados', 'avocados', 'AVO-HAS', 'fresh_produce', '{
  "type": "object",
  "properties": {
    "variety": {"type": "string", "enum": ["Hass", "Fuerte", "Pinkerton"]},
    "size_grade": {"type": "string", "enum": ["12", "14", "16", "18", "20", "22"]},
    "dry_matter": {"type": "number", "minimum": 20, "maximum": 30},
    "harvest_date": {"type": "string", "format": "date"}
  }
}', 'Fresh Hass and Fuerte avocados', 5);

-- Insert sample organizations (suppliers)
INSERT INTO organizations (id, name, legal_name, slug, type, status, verification_level, country_code, region, city, description, annual_capacity, capacity_unit, profile_completeness, trust_score, risk_score, year_established, employee_count, website, bank_account_verified) VALUES
('org_nce', 'Nairobi Coffee Exporters Ltd', 'Nairobi Coffee Exporters Limited', 'nairobi-coffee-exporters-ltd', 'exporter', 'verified', 'fully_verified', 'KE', 'Nairobi', 'Nairobi', 'Premium Arabica coffee exporter specializing in AA and AB grades from the Nyeri region. Family-owned since 2015 with state-of-the-art processing facilities.', 5000, 'mt', 95, 87, 15, 2015, '11-50', 'https://nairobicoffee.co.ke', true),

('org_scc', 'Sidama Coffee Cooperative', 'Sidama Coffee Farmers Cooperative Union', 'sidama-coffee-cooperative', 'cooperative', 'verified', 'fully_verified', 'ET', 'Sidama', 'Hawassa', 'Farmer-owned cooperative representing over 10,000 smallholder farmers in the Sidama region. Known for exceptional Yirgacheffe and Guji coffees.', 8000, 'mt', 92, 82, 20, 2001, '51-200', 'https://sidamacoffee.et', true),

('org_lae', 'Lagos Agri Exports', 'Lagos Agricultural Exports Limited', 'lagos-agri-exports', 'exporter', 'verified', 'fully_verified', 'NG', 'Lagos', 'Lagos', 'Leading exporter of sesame seeds, cocoa beans, and cashew nuts from Nigeria. Strong presence in European and Asian markets.', 12000, 'mt', 88, 75, 25, 2010, '21-50', 'https://lagosagri.ng', true),

('org_gsc', 'Ghana Shea Cooperative', 'Ghana Shea Collectors Cooperative', 'ghana-shea-cooperative', 'cooperative', 'verified', 'business_registration', 'GH', 'Northern', 'Tamale', 'Women-led cooperative producing organic shea butter and shea nuts for the cosmetics and food industry.', 3000, 'mt', 78, 71, 30, 2012, '51-200', null, false),

('org_tza', 'Tanzania Spice Traders', 'Tanzania Spice Traders Ltd', 'tanzania-spice-traders', 'trader', 'verified', 'banking_verified', 'TZ', 'Zanzibar', 'Zanzibar City', 'Exporter of premium cloves, cinnamon, black pepper, and cardamom from Zanzibar and Pemba islands.', 1500, 'mt', 70, 68, 35, 2018, '11-50', null, true);

-- Insert sample organizations (buyers)
INSERT INTO organizations (id, name, legal_name, slug, type, status, verification_level, country_code, region, city, description, profile_completeness, trust_score, risk_score, year_established, employee_count, website, bank_account_verified) VALUES
('org_hsr', 'Hamburg Specialty Roasters GmbH', 'Hamburg Specialty Roasters GmbH', 'hamburg-specialty-roasters', 'importer', 'verified', 'fully_verified', 'DE', 'Hamburg', 'Hamburg', 'Artisan coffee roaster importing specialty-grade African coffees for the German and Scandinavian markets.', 90, 91, 12, 2008, '51-200', 'https://hamburgroasters.de', true),

('org_gft', 'Gulf Food Trading LLC', 'Gulf Food Trading LLC', 'gulf-food-trading', 'distributor', 'verified', 'fully_verified', 'AE', 'Dubai', 'Dubai', 'Major food distributor serving the GCC region. Sourcing grains, pulses, and spices from across Africa.', 85, 88, 18, 2005, '201-500', 'https://gulffoodtrading.ae', true),

('org_dcp', 'Dutch Cocoa Processing BV', 'Dutch Cocoa Processing BV', 'dutch-cocoa-processing', 'manufacturer', 'verified', 'fully_verified', 'NL', 'Amsterdam', 'Amsterdam', 'Leading cocoa processor and chocolate manufacturer. Sustainable sourcing from West Africa.', 93, 94, 10, 1995, '500+', 'https://dutchcocoa.nl', true),

('org_jti', 'Japan Tea Imports Co', 'Japan Tea Imports Co Ltd', 'japan-tea-imports', 'importer', 'verified', 'fully_verified', 'JP', 'Tokyo', 'Tokyo', 'Specialty tea importer focusing on African tea varieties for the Japanese market.', 82, 85, 15, 2010, '21-50', 'https://japanteaimports.co.jp', true);

-- Insert sample products
INSERT INTO products (id, organization_id, created_by_user_id, category_id, title, slug, description, attributes, origin_country, origin_region, harvest_year, available_quantity, available_unit, moq, moq_unit, price_fob, price_cif, price_unit, price_currency, packaging_type, packaging_weight, packaging_unit, incoterm, quality_grade, certifications, eligible_countries, status, is_featured, compliance_score, primary_image_url) VALUES
('prod_001', 'org_nce', 'usr_001', 'cat_coffee_arabica', 'Kenya AA Arabica Coffee - Washed Process', 'kenya-aa-arabica-coffee-washed', 'Premium single-origin coffee from Nyeri region. Washed process, sun-dried on raised beds. Notes of blackcurrant, citrus, and chocolate.', '{"variety": "Arabica", "grade": "AA", "processing": "washed", "crop_year": 2026, "cupping_score": 87.5, "moisture_content": 10.5, "defect_count": 2, "screen_size": "17/18"}', 'KE', 'Nyeri', 2026, 500, 'mt', 10, 'mt', 4.85, 5.45, 'kg', 'USD', 'jute_bag', 60, 'kg', 'FOB', 'AA', ARRAY['organic', 'fair_trade'], ARRAY['US', 'DE', 'NL', 'JP', 'AE'], 'published', true, 92, null),

('prod_002', 'org_nce', 'usr_001', 'cat_coffee_arabica', 'Kenya AB Arabica Coffee - Natural Process', 'kenya-ab-arabica-coffee-natural', 'Naturally processed coffee from Kirinyaga. Full body with notes of berries, wine, and dark chocolate.', '{"variety": "Arabica", "grade": "AB", "processing": "natural", "crop_year": 2026, "cupping_score": 85.0, "moisture_content": 11.0, "defect_count": 4, "screen_size": "15/16"}', 'KE', 'Kirinyaga', 2026, 350, 'mt', 10, 'mt', 4.20, 4.80, 'kg', 'USD', 'jute_bag', 60, 'kg', 'FOB', 'AB', ARRAY['rainforest_alliance'], ARRAY['DE', 'NL', 'AE'], 'published', false, 88, null),

('prod_003', 'org_scc', 'usr_002', 'cat_coffee_arabica', 'Ethiopia Yirgacheffe - Natural Process', 'ethiopia-yirgacheffe-natural', 'Exceptional Yirgacheffe from the Gedio zone. Natural process with floral aroma and blueberry notes.', '{"variety": "Arabica", "grade": "Grade 1", "processing": "natural", "crop_year": 2026, "cupping_score": 89.0, "moisture_content": 10.2, "defect_count": 1, "screen_size": "14/16"}', 'ET', 'Gedio', 2026, 300, 'mt', 5, 'mt', 5.20, 5.90, 'kg', 'USD', 'grainpro', 60, 'kg', 'FOB', 'Grade 1', ARRAY['organic'], ARRAY['US', 'DE', 'JP'], 'published', true, 90, null),

('prod_004', 'org_scc', 'usr_002', 'cat_coffee_arabica', 'Ethiopia Sidama - Washed Process', 'ethiopia-sidama-washed', 'Classic Sidama washed coffee with bright acidity, lemon zest, and jasmine floral notes.', '{"variety": "Arabica", "grade": "Grade 2", "processing": "washed", "crop_year": 2026, "cupping_score": 86.5, "moisture_content": 10.8, "defect_count": 3, "screen_size": "15/16"}', 'ET', 'Sidama', 2026, 400, 'mt', 5, 'mt', 4.60, 5.30, 'kg', 'USD', 'jute_bag', 60, 'kg', 'FOB', 'Grade 2', ARRAY['fair_trade'], ARRAY['DE', 'NL', 'US'], 'published', false, 87, null),

('prod_005', 'org_lae', 'usr_003', 'cat_sesame', 'Nigerian White Hulled Sesame Seeds', 'nigerian-white-hulled-sesame', 'Premium white hulled sesame seeds with high oil content. Ideal for confectionery and tahini production.', '{"color": "white", "purity": 99.5, "oil_content": 52.0, "moisture": 6.5, "foreign_matter": 0.5}', 'NG', 'Kano', null, 1000, 'mt', 50, 'mt', 1.85, 2.20, 'kg', 'USD', 'pp_bag', 50, 'kg', 'FOB', 'Premium', ARRAY[], ARRAY['TR', 'IN', 'JP', 'KR'], 'published', true, 85, null),

('prod_006', 'org_lae', 'usr_003', 'cat_cocoa', 'Nigeria Cocoa Beans - Grade 1', 'nigeria-cocoa-beans-grade-1', 'Well-fermented Grade 1 cocoa beans from Ondo State. Excellent flavor profile for premium chocolate.', '{"type": "Forastero", "grade": "Grade 1", "fermentation": 85, "moisture": 7.0}', 'NG', 'Ondo', null, 200, 'mt', 20, 'mt', 3.20, 3.80, 'kg', 'USD', 'jute_bag', 65, 'kg', 'FOB', 'Grade 1', ARRAY['rainforest_alliance'], ARRAY['NL', 'DE', 'US'], 'published', false, 83, null),

('prod_007', 'org_gsc', 'usr_004', 'cat_cocoa', 'Ghana Organic Shea Nuts', 'ghana-organic-shea-nuts', 'Wild-harvested organic shea nuts from Northern Ghana. High stearin content for quality shea butter.', '{"type": "Forastero", "grade": "Grade 1", "fermentation": 80, "moisture": 6.5}', 'GH', 'Northern', null, 150, 'mt', 10, 'mt', 0.95, 1.30, 'kg', 'USD', 'pp_bag', 50, 'kg', 'FOB', 'Premium', ARRAY['organic'], ARRAY['NL', 'DE', 'US', 'JP'], 'published', false, 78, null),

('prod_008', 'org_tza', 'usr_005', 'cat_coffee_arabica', 'Zanzibar Black Pepper', 'zanzibar-black-pepper', 'Premium black peppercorns from Zanzibar. Bold, pungent flavor with citrus undertones.', '{"variety": "Arabica", "grade": "AA", "processing": "washed", "crop_year": 2026}', 'TZ', 'Zanzibar', null, 50, 'mt', 5, 'mt', 8.50, 9.80, 'kg', 'USD', 'carton', 25, 'kg', 'CIF', 'Premium', ARRAY[], ARRAY['IN', 'AE', 'DE'], 'published', false, 72, null);

-- Insert compliance rules for key corridors
INSERT INTO compliance_rules (id, origin_country, destination_country, product_category_id, requirement_type, requirement, description, responsible_party, issuing_authority, estimated_time_days, estimated_cost_usd, validity_period, verification_method, source_name, rule_version) VALUES
('rule_001', 'KE', 'DE', 'cat_coffee_arabica', 'document', 'Phytosanitary Certificate', 'Certificate confirming coffee is free from pests and diseases', 'exporter', 'Kenya Plant Health Inspectorate Service (KEPHIS)', 3, 150, 'shipment-specific', 'Document and issuing-body check', 'KEPHIS Official Guidelines', 1),

('rule_002', 'KE', 'DE', 'cat_coffee_arabica', 'document', 'Certificate of Origin', 'Certificate confirming origin of coffee beans', 'exporter', 'Kenya National Chamber of Commerce', 2, 50, 'shipment-specific', 'Document and issuing-body check', 'KNCCI Export Guidelines', 1),

('rule_003', 'KE', 'DE', 'cat_coffee_arabica', 'document', 'Organic Certificate', 'EU organic certification for organic products', 'exporter', 'ECOcert / Control Union', 14, 500, 'annual', 'Document and issuing-body check', 'EU Organic Regulation 2018/848', 1),

('rule_004', 'KE', 'US', 'cat_coffee_arabica', 'document', 'Phytosanitary Certificate', 'USDA APHIS phytosanitary certificate', 'exporter', 'KEPHIS', 3, 150, 'shipment-specific', 'Document and issuing-body check', 'USDA APHIS Import Requirements', 1),

('rule_005', 'KE', 'US', 'cat_coffee_arabica', 'registration', 'FDA Food Facility Registration', 'Registration with US FDA for food facilities', 'exporter', 'US Food and Drug Administration', 30, 0, 'biennial', 'Online verification', 'FDA Food Safety Modernization Act', 1),

('rule_006', 'ET', 'DE', 'cat_coffee_arabica', 'document', 'Phytosanitary Certificate', 'Certificate for Ethiopian coffee exports to EU', 'exporter', 'Ethiopian Agricultural Authority', 5, 120, 'shipment-specific', 'Document and issuing-body check', 'Ethiopian Agricultural Authority Export Guide', 1),

('rule_007', 'NG', 'NL', 'cat_cocoa', 'document', 'Phytosanitary Certificate', 'Required for cocoa bean exports', 'exporter', 'Nigerian Agricultural Quarantine Service', 5, 100, 'shipment-specific', 'Document and issuing-body check', 'NAQS Export Protocol', 1),

('rule_008', 'NG', 'NL', 'cat_cocoa', 'certification', 'Rainforest Alliance Certification', 'Sustainability certification for cocoa', 'exporter', 'Rainforest Alliance', 30, 800, 'annual', 'Document and online verification', 'Rainforest Alliance Certification Standards', 1);
