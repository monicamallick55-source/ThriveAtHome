-- Seed vetted car repair / body shop providers for Car Care & Roadside service category
INSERT INTO service_providers (full_name, company_name, phone, email, service_types, city, state, is_active, rating_average) VALUES
('Tony Martinez', 'Martinez Auto Body & Repair', '312-555-0404', 'tony@martinezauto.com', ARRAY['car_repair', 'body_shop'], 'Chicago', 'IL', true, 4.7),
('Kevin Park', 'Park''s Certified Auto Service', '312-555-0505', 'kevin@parksauto.com', ARRAY['car_repair', 'scheduled_maintenance', 'car_inspection'], 'Chicago', 'IL', true, 4.9);
