-- Add a header column to the quran_editions table
ALTER TABLE quran_editions 
ADD COLUMN header text;

-- Policy to allow updates for authenticated users (if not already enabled)
CREATE POLICY "Allow authenticated update" ON quran_editions
FOR UPDATE USING (auth.role() = 'authenticated');
