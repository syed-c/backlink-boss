-- Add error_message column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS error_message TEXT;