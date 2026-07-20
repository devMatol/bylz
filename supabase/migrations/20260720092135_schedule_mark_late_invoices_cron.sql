/*
# Schedule daily "mark late invoices" cron job

1. Extension
- Enable the pg_cron extension (Supabase-managed) if not already enabled.
2. Scheduled job
- A daily job at 01:00 server time flips invoices whose status is 'pending'
  and whose due_date is strictly before the current date to status 'late'.
- Pure SQL approach (no edge function needed) as allowed by the spec.
3. Notes
- Idempotent: re-running this migration drops & reschedules the job.
- The job runs as the postgres user and bypasses RLS, which is correct for
  a system maintenance task.
*/

create extension if not exists pg_cron with schema extensions;

-- ensure the extension can be used from the public schema via a helper
do $$
begin
  if not exists (
    select 1 from pg_proc where proname = 'cron_schedule' and pronamespace = (select oid from pg_namespace where nspname = 'cron')
  ) then
    null;
  end if;
end $$;

-- Drop any existing job with the same name, then schedule
do $$
declare
  job_id bigint;
begin
  select jobid into job_id from cron.job where jobname = 'mark-late-invoices';
  if found then
    perform cron.unschedule(job_id);
  end if;

  perform cron.schedule(
    'mark-late-invoices',
    '0 1 * * *',
    $sql$ update invoices set status = 'late' where status = 'pending' and due_date < current_date $sql$
  );
end $$;
