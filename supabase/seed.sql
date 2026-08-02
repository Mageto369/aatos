-- Seed data for AATOS staging environment
-- Run with: supabase db seed

-- Product Categories
INSERT INTO product_categories (name, slug, code, group_type, description, sort_order) VALUES
('Coffee', 'coffee', 'COF', 'beverage_crops', 'All coffee varieties and processed coffee products', 1),
('Tea', 'tea', 'TEA', 'beverage_crops', 'Black, green, white, and specialty teas', 2),
('Cocoa', 'cocoa', 'CAC', 'beverage_crops', 'Cocoa beans and processed cocoa products', 3),
('Avocados', 'avocados', 'AVO', 'fresh_produce', 'Fresh avocados - Hass, Fuerte, and other varieties', 4),
('Mangoes', 'mangoes', 'MAN', 'fresh_produce', 'Fresh mangoes - various varieties', 5),
('Pineapples', 'pineapples', 'PIN', 'fresh_produce', 'Fresh pineapples', 6),
('Bananas', 'bananas', 'BAN', 'fresh_produce', 'Cavendish and plantain bananas', 7),
('Cashew Nuts', 'cashew-nuts', 'CAS', 'dry_commodities', 'Raw and processed cashew nuts', 8),
('Sesame Seeds', 'sesame-seeds', 'SES', 'dry_commodities', 'White and black sesame seeds', 9),
('Soybeans', 'soybeans', 'SOY', 'dry_commodities', 'Soybeans and soy products', 10),
('Vanilla', 'vanilla', 'VAN', 'spices_botanicals', 'Madagascar and other vanilla varieties', 11),
('Cinnamon', 'cinnamon', 'CIN', 'spices_botanicals', 'Ceylon and cassia cinnamon', 12),
('Cardamom', 'cardamom', 'CAR', 'spices_botanicals', 'Green and black cardamom', 13),
('Chickpeas', 'chickpeas', 'CHI', 'dry_commodities', 'Desi and Kabuli chickpeas', 14),
('Dry Beans', 'dry-beans', 'BEA', 'dry_commodities', 'Various dry bean varieties', 15);

-- Sample Organizations
INSERT INTO organizations (name, legal_name, slug, type, status, verification_level, country_code, city, description, profile_completeness, trust_score) VALUES
('Green Valley Cooperative', 'Green Valley Farmers Cooperative Ltd', 'green-valley-cooperative', 'cooperative', 'verified', 'fully_verified', 'KE', 'Nairobi', 'Leading coffee and tea cooperative in Kenya with 500+ member farmers', 95, 92),
('Sunrise Exports Ltd', 'Sunrise Agricultural Exports Limited', 'sunrise-exports', 'exporter', 'verified', 'fully_verified', 'KE', 'Mombasa', 'Premier exporter of fresh produce to European markets', 88, 89),
('Highlands Avocado Farm', 'Highlands Avocado Farm Ltd', 'highlands-avocado', 'farmer', 'verified', 'business_registration', 'KE', 'Nakuru', 'Specialized Hass avocado producer with GlobalGAP certification', 82, 85),
('Atlantic Trading GmbH', 'Atlantic Trading GmbH', 'atlantic-trading', 'importer', 'verified', 'fully_verified', 'DE', 'Hamburg', 'European importer specializing in African agricultural products', 90, 91),
('Nordic Fresh AB', 'Nordic Fresh AB', 'nordic-fresh', 'distributor', 'verified', 'business_registration', 'SE', 'Stockholm', 'Scandinavian distributor of fresh tropical produce', 78, 80),
('Rwanda Coffee Union', 'Rwanda Coffee Growers Union', 'rwanda-coffee-union', 'cooperative', 'verified', 'fully_verified', 'RW', 'Kigali', 'Representing 30,000+ coffee farmers in Rwanda', 92, 94);

-- Sample Users (passwords are hashed 'password123' for testing)
INSERT INTO users (email, first_name, last_name, display_name, status, email_verified) VALUES
('admin@aatos.dev', 'System', 'Admin', 'System Admin', 'active', true),
('john@greenvalley.co.ke', 'John', 'Kamau', 'John Kamau', 'active', true),
('mary@sunrise.co.ke', 'Mary', 'Odhiambo', 'Mary Odhiambo', 'active', true),
('peter@highlands.co.ke', 'Peter', 'Njoroge', 'Peter Njoroge', 'active', true),
('hans@atlantic.de', 'Hans', 'Mueller', 'Hans Mueller', 'active', true),
('anna@nordic.se', 'Anna', 'Lindqvist', 'Anna Lindqvist', 'active', true),
('jean@rwandacoffee.rw', 'Jean', 'Bosco', 'Jean Bosco', 'active', true);

-- Organization Members
INSERT INTO organization_members (organization_id, user_id, role, is_primary_contact, joined_at) VALUES
((SELECT id FROM organizations WHERE slug = 'green-valley-cooperative'), (SELECT id FROM users WHERE email = 'john@greenvalley.co.ke'), 'admin', true, NOW()),
((SELECT id FROM organizations WHERE slug = 'sunrise-exports'), (SELECT id FROM users WHERE email = 'mary@sunrise.co.ke'), 'admin', true, NOW()),
((SELECT id FROM organizations WHERE slug = 'highlands-avocado'), (SELECT id FROM users WHERE email = 'peter@highlands.co.ke'), 'owner', true, NOW()),
((SELECT id FROM organizations WHERE slug = 'atlantic-trading'), (SELECT id FROM users WHERE email = 'hans@atlantic.de'), 'admin', true, NOW()),
((SELECT id FROM organizations WHERE slug = 'nordic-fresh'), (SELECT id FROM users WHERE email = 'anna@nordic.se'), 'admin', true, NOW()),
((SELECT id FROM organizations WHERE slug = 'rwanda-coffee-union'), (SELECT id FROM users WHERE email = 'jean@rwandacoffee.rw'), 'admin', true, NOW());

-- Update primary contact references
UPDATE organizations SET primary_contact_user_id = (SELECT id FROM users WHERE email = 'john@greenvalley.co.ke') WHERE slug = 'green-valley-cooperative';
UPDATE organizations SET primary_contact_user_id = (SELECT id FROM users WHERE email = 'mary@sunrise.co.ke') WHERE slug = 'sunrise-exports';
UPDATE organizations SET primary_contact_user_id = (SELECT id FROM users WHERE email = 'peter@highlands.co.ke') WHERE slug = 'highlands-avocado';
UPDATE organizations SET primary_contact_user_id = (SELECT id FROM users WHERE email = 'hans@atlantic.de') WHERE slug = 'atlantic-trading';
UPDATE organizations SET primary_contact_user_id = (SELECT id FROM users WHERE email = 'anna@nordic.se') WHERE slug = 'nordic-fresh';
UPDATE organizations SET primary_contact_user_id = (SELECT id FROM users WHERE email = 'jean@rwandacoffee.rw') WHERE slug = 'rwanda-coffee-union';

-- Sample Products
INSERT INTO products (organization_id, created_by_user_id, category_id, title, description, attributes, origin_country, origin_region, available_quantity, available_unit, moq, price_fob, currency, quality_grade, certifications, status, published_at, is_featured) VALUES
((SELECT id FROM organizations WHERE slug = 'green-valley-cooperative'), (SELECT id FROM users WHERE email = 'john@greenvalley.co.ke'), (SELECT id FROM product_categories WHERE slug = 'coffee'), 'Kenya AA Arabica Coffee', 'Premium Kenya AA Arabica coffee beans, washed process, grown at 1,800m elevation', '{"variety": "Arabica", "grade": "AA", "processing": "washed", "crop_year": 2026, "cupping_score": 87.5, "altitude_masl": 1800, "moisture_content": 10.5}', 'KE', 'Nyeri', 5000, 'kg', 1000, 8.50, 'USD', 'AA', ARRAY['organic', 'fair_trade'], 'published', NOW(), true),
((SELECT id FROM organizations WHERE slug = 'highlands-avocado'), (SELECT id FROM users WHERE email = 'peter@highlands.co.ke'), (SELECT id FROM product_categories WHERE slug = 'avocados'), 'Hass Avocados Grade 1', 'Premium Hass avocados, 14% dry matter, ready for export', '{"variety": "Hass", "size_grade": "14", "dry_matter": 23.5, "harvest_date": "2026-07-15", "packaging": "4kg_carton"}', 'KE', 'Nakuru', 10000, 'kg', 2000, 3.20, 'USD', 'Grade 1', ARRAY['global_gap', 'organic'], 'published', NOW(), true),
((SELECT id FROM organizations WHERE slug = 'rwanda-coffee-union'), (SELECT id FROM users WHERE email = 'jean@rwandacoffee.rw'), (SELECT id FROM product_categories WHERE slug = 'coffee'), 'Rwanda Bourbon Specialty', 'Bourbon variety from Rwanda''s highlands, notes of jasmine and black tea', '{"variety": "Bourbon", "grade": "A", "processing": "washed", "crop_year": 2026, "cupping_score": 86.0, "altitude_masl": 2000}', 'RW', 'Western Province', 3000, 'kg', 500, 7.80, 'USD', 'A', ARRAY['fair_trade', 'rainforest_alliance'], 'published', NOW(), false),
((SELECT id FROM organizations WHERE slug = 'sunrise-exports'), (SELECT id FROM users WHERE email = 'mary@sunrise.co.ke'), (SELECT id FROM product_categories WHERE slug = 'mangoes'), 'Kent Mangoes', 'Sweet and fiber-free Kent mangoes, perfect for European markets', '{"variety": "Kent", "brix": 14, "size": "300-500g", "packaging": "5kg_box"}', 'KE', 'Mombasa', 8000, 'kg', 1000, 2.10, 'USD', 'Export Grade', ARRAY['global_gap'], 'published', NOW(), false);
