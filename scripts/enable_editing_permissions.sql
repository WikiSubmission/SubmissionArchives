-- 1. Add header column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quran_editions' AND column_name = 'header') THEN
        ALTER TABLE "public"."quran_editions" ADD COLUMN "header" text;
    END IF;
END $$;

-- 2. Enable RLS (if not already)
ALTER TABLE "public"."quran_editions" ENABLE ROW LEVEL SECURITY;

-- 3. Create/Update Policies for Anonymous Access (for this internal tool)

-- Allow SELECT for everyone (anon)
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."quran_editions";
CREATE POLICY "Enable read access for all users"
ON "public"."quran_editions"
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow UPDATE for everyone (anon) - CAUTION: This makes the table publicly editable. 
-- Since this is a local tool/admin interface, this is acceptable for now.
DROP POLICY IF EXISTS "Enable update for all users" ON "public"."quran_editions";
CREATE POLICY "Enable update for all users"
ON "public"."quran_editions"
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Ensure INSERT is also allowed if needed (though we primarily use the script for inserts)
DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."quran_editions";
CREATE POLICY "Enable insert for all users"
ON "public"."quran_editions"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
