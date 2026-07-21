/*
  # Stripe Monetization Migration

  1. Changes to `profiles`
    - Add `trial_used` boolean field (default `false`) to track whether the user has used their 14-day trial.

  2. New Table `stripe_webhook_events`
    - Stores received webhook event IDs for idempotency processing.
    - Enables RLS (bypassed by service role).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_used boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  type text NOT NULL,
  payload jsonb,
  processed_at timestamptz DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
