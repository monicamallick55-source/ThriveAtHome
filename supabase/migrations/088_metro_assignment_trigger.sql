-- G5.3: Metro area auto-assignment trigger
CREATE OR REPLACE FUNCTION assign_metro_area(member_zip text)
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT id FROM metro_areas
  WHERE zip_prefixes && ARRAY[LEFT(member_zip, 3), LEFT(member_zip, 5)]
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION trg_assign_member_metro()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.zip_code IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.zip_code IS DISTINCT FROM OLD.zip_code) THEN
    NEW.metro_area_id := assign_metro_area(NEW.zip_code);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_member_metro ON members;
CREATE TRIGGER assign_member_metro
  BEFORE INSERT OR UPDATE OF zip_code ON members
  FOR EACH ROW EXECUTE FUNCTION trg_assign_member_metro();
