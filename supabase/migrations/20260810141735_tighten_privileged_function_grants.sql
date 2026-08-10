/*
  # Tighten EXECUTE grants on privileged functions and protect the audit trail

  1. `write_audit_log` was executable by anon and every signed-in user, which let
     anyone append arbitrary rows to the admin audit trail. It is now restricted
     to platform admins (its only legitimate callers are the admin RPCs, which
     run in an admin's session) and revoked from anon.

  2. The `admin_*` RPCs each verify `is_platform_admin()` internally, but there is
     no reason for the anonymous role to hold EXECUTE on them at all.

  3. The quota trigger functions do not need any client EXECUTE grant: triggers
     fire independently of grants.
*/

CREATE OR REPLACE FUNCTION public.write_audit_log(p_action text, p_target uuid, p_details jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO public.audit_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), left(coalesce(p_action, 'unknown'), 100), p_target, COALESCE(p_details, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.write_audit_log(text, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.write_audit_log(text, uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.write_audit_log(text, uuid, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.admin_end_impersonation(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.admin_grant_trial(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_admin_role(uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_suspended(uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_user_plan(uuid, public.plan_type) FROM anon;
REVOKE ALL ON FUNCTION public.admin_start_impersonation(uuid) FROM anon;

REVOKE ALL ON FUNCTION public.enforce_invoice_quota() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_client_quota() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.plan_quota_for(uuid) FROM anon;
