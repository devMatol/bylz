/*
# Add unique constraint on urssaf_declarations (company_id, period_start)

1. Changes
- Add UNIQUE constraint on (company_id, period_start) so upserts on declare work.
2. Notes
- Allows the "Marquer comme déclaré" action to upsert a declaration row for a given period without creating duplicates.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'urssaf_declarations_company_id_period_start_key'
  ) THEN
    ALTER TABLE urssaf_declarations
      ADD CONSTRAINT urssaf_declarations_company_id_period_start_key
      UNIQUE (company_id, period_start);
  END IF;
END $$;
