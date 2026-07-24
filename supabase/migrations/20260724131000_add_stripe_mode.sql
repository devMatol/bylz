-- Add stripe_mode column to factpulse_status table
ALTER TABLE factpulse_status ADD COLUMN IF NOT EXISTS stripe_mode text NOT NULL DEFAULT 'test';

-- Initialize default row stripe_mode to test
UPDATE factpulse_status SET stripe_mode = 'test' WHERE id = 'default';
