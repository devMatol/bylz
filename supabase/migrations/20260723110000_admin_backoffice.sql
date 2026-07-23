-- Create admin_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'admin');
  END IF;
END $$;

-- Alter profiles table to add admin_role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role admin_role DEFAULT NULL;

-- Bootstrap matthiasollivier123@gmail.com as super_admin
UPDATE profiles
SET is_admin = true, admin_role = 'super_admin'
WHERE email = 'matthiasollivier123@gmail.com';

-- Create plans table for dynamic plan & offer management
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  stripe_price_id text,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  invoice_limit integer, -- NULL = unlimited
  client_limit integer, -- NULL = unlimited
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial plans if empty
INSERT INTO plans (key, name, price_cents, stripe_price_id, features, invoice_limit, client_limit, is_active)
VALUES
  (
    'starter',
    'Starter',
    0,
    NULL,
    '{"fiscalDashboard": false, "reminders": false, "exports": false, "paymentLinks": false, "multiCompany": false}'::jsonb,
    10,
    3,
    true
  ),
  (
    'solo',
    'Solo',
    900,
    'price_1TvYmr2X0yCzQQsNrPbSS9NC',
    '{"fiscalDashboard": true, "reminders": true, "exports": true, "paymentLinks": false, "multiCompany": false}'::jsonb,
    NULL,
    NULL,
    true
  ),
  (
    'pro',
    'Pro',
    1900,
    'price_1TvYnW2X0yCzQQsN930PPkgJ',
    '{"fiscalDashboard": true, "reminders": true, "exports": true, "paymentLinks": true, "multiCompany": true}'::jsonb,
    NULL,
    NULL,
    true
  )
ON CONFLICT (key) DO NOTHING;

-- Create admin_impersonation_sessions table
CREATE TABLE IF NOT EXISTS admin_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Create admin_metrics_cache table
CREATE TABLE IF NOT EXISTS admin_metrics_cache (
  cache_key text PRIMARY KEY,
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies for plans (public read, admin write)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans" ON plans
  FOR SELECT USING (true);

CREATE POLICY "Admins can update plans" ON plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for admin_impersonation_sessions
ALTER TABLE admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage impersonation sessions" ON admin_impersonation_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for admin_metrics_cache
ALTER TABLE admin_metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage metrics cache" ON admin_metrics_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
