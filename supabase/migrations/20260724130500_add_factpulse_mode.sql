-- Add mode column to factpulse_status for Super Admin Prod/Test toggle
ALTER TABLE factpulse_status ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'sandbox';

-- Initialize default row to sandbox mode
UPDATE factpulse_status SET mode = 'sandbox' WHERE id = 'default';
