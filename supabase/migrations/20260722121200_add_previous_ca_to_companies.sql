/*
  # Add previous_ca to companies

  1. Changes to `companies`
    - Add `previous_ca` numeric field (default `0`) to track revenue collected before using Bylz.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'previous_ca'
  ) THEN
    ALTER TABLE companies ADD COLUMN previous_ca numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;
