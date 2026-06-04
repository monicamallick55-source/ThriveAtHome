-- Service providers table: vetted external providers for home services
CREATE TABLE IF NOT EXISTS service_providers (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  full_name       text NOT NULL,
  company_name    text,
  phone           text,
  email           text,
  service_types   text[] DEFAULT '{}',
  city            text,
  state           text,
  is_active       boolean NOT NULL DEFAULT true,
  rating_average  numeric
);
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "navigator_admin_read_providers" ON service_providers FOR SELECT TO authenticated USING (true);

-- Seed 3 test vetted home service providers in Chicago, IL
INSERT INTO service_providers (full_name, company_name, phone, email, service_types, city, state, is_active, rating_average) VALUES
('Maria Johnson', 'HomeHelper Chicago', '312-555-0101', 'maria@homehelperchicago.com', ARRAY['home_cleaning', 'home_service'], 'Chicago', 'IL', true, 4.8),
('Robert Chen', 'Chen Home Care', '312-555-0202', 'robert@chenhomecare.com', ARRAY['home_service', 'grocery_help'], 'Chicago', 'IL', true, 4.6),
('Anika Patel', 'Bright Home Services', '312-555-0303', 'anika@brighthome.com', ARRAY['home_cleaning', 'home_service', 'tech_help'], 'Chicago', 'IL', true, 4.9);
