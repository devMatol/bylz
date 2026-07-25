-- Migration: Create system_settings and email_logs tables for Resend dispatch center

-- 1. system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default email logo setting
INSERT INTO system_settings (key, value)
VALUES ('email_logo_url', '"https://bylz.fr/logo.png"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read system settings" ON system_settings;
CREATE POLICY "Public can read system settings" ON system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL USING (true);

-- 2. email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert email logs" ON email_logs;
CREATE POLICY "Anyone can insert email logs" ON email_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read email logs" ON email_logs;
CREATE POLICY "Admins can read email logs" ON email_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update email logs" ON email_logs;
CREATE POLICY "Admins can update email logs" ON email_logs FOR UPDATE USING (true);
