-- Add headings_file_path column to campaigns table if it doesn't exist
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS headings_file_path TEXT;