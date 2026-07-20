/*
# Add note column to invoices

1. Modified Tables
- `invoices`: add `note text` column (nullable) for optional notes on invoices,
  matching the existing `note` column on `quotes`.
2. Security
- No policy changes needed; RLS already covers the column via table-level policies.
3. Notes
- Non-destructive: ADD COLUMN with NULL default, no data loss.
*/

alter table invoices add column if not exists note text;
