/*
  # Privileged administrator operations

  1. RPCs (SECURITY DEFINER, caller verified inside)
     - admin_set_user_plan, admin_grant_trial, admin_set_suspended
     - admin_set_admin_role, admin_delete_user (super admin only)
     - admin_start_impersonation, admin_end_impersonation
     Every one writes an `audit_logs` row, so privileged actions are recorded even
     though clients cannot insert into that table.
  2. Audit log
     - Administrators may read it; nobody may write it directly.
  3. Administrator read access
     - Admin SELECT policies on the operational tables so the back office and the
       account-viewing feature keep working now that the always-true policies are
       gone. Writes stay owner-only.
  4. Admin support tables
     - Replace the `EXISTS (... is_admin ...)` predicates, which read a column the
       user used to be able to write, with the definer helper.
*/

-- ---------------------------------------------------------------- audit trail
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

REVOKE ALL ON TABLE public.audit_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;

-- --------------------------------------------------- admin read on user data
CREATE POLICY "companies_select_admin" ON public.companies
  FOR SELECT TO authenticated USING (public.is_platform_admin());

CREATE POLICY "clients_select_admin" ON public.clients
  FOR SELECT TO authenticated USING (public.is_platform_admin());

CREATE POLICY "invoices_select_admin" ON public.invoices
  FOR SELECT TO authenticated USING (public.is_platform_admin());

CREATE POLICY "quotes_select_admin" ON public.quotes
  FOR SELECT TO authenticated USING (public.is_platform_admin());

CREATE POLICY "invoice_lines_select_admin" ON public.invoice_lines
  FOR SELECT TO authenticated USING (public.is_platform_admin());

CREATE POLICY "quote_lines_select_admin" ON public.quote_lines
  FOR SELECT TO authenticated USING (public.is_platform_admin());

CREATE POLICY "catalog_items_select_admin" ON public.catalog_items
  FOR SELECT TO authenticated USING (public.is_platform_admin());

CREATE POLICY "urssaf_select_admin" ON public.urssaf_declarations
  FOR SELECT TO authenticated USING (public.is_platform_admin());

-- ------------------------------------------------------ admin support tables
DROP POLICY IF EXISTS "Admins can manage impersonation sessions" ON public.admin_impersonation_sessions;
CREATE POLICY "impersonation_select_admin" ON public.admin_impersonation_sessions
  FOR SELECT TO authenticated USING (public.is_platform_admin());

REVOKE ALL ON TABLE public.admin_impersonation_sessions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.admin_impersonation_sessions FROM authenticated;
GRANT SELECT ON TABLE public.admin_impersonation_sessions TO authenticated;

DROP POLICY IF EXISTS "Admins can manage metrics cache" ON public.admin_metrics_cache;
CREATE POLICY "metrics_cache_select_admin" ON public.admin_metrics_cache
  FOR SELECT TO authenticated USING (public.is_platform_admin());
CREATE POLICY "metrics_cache_insert_admin" ON public.admin_metrics_cache
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY "metrics_cache_update_admin" ON public.admin_metrics_cache
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "metrics_cache_delete_admin" ON public.admin_metrics_cache
  FOR DELETE TO authenticated USING (public.is_platform_admin());

REVOKE ALL ON TABLE public.admin_metrics_cache FROM anon;

DROP POLICY IF EXISTS "Admins can update plans" ON public.plans;
CREATE POLICY "plans_insert_admin" ON public.plans
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY "plans_update_admin" ON public.plans
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "plans_delete_admin" ON public.plans
  FOR DELETE TO authenticated USING (public.is_platform_admin());

-- ------------------------------------------------------------------- helpers
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action text,
  p_target uuid,
  p_details jsonb
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.audit_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), p_action, p_target, COALESCE(p_details, '{}'::jsonb));
$$;

REVOKE ALL ON FUNCTION public.write_audit_log(text, uuid, jsonb) FROM PUBLIC;

-- --------------------------------------------------------------- admin RPCs
CREATE OR REPLACE FUNCTION public.admin_set_user_plan(p_target uuid, p_plan plan_type)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.profiles SET plan = p_plan WHERE id = p_target;
  PERFORM public.write_audit_log('plan_change', p_target, jsonb_build_object('new_plan', p_plan));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_trial(p_target uuid, p_days integer)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ends timestamptz;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_days IS NULL OR p_days < 1 OR p_days > 365 THEN
    RAISE EXCEPTION 'invalid duration';
  END IF;

  v_ends := now() + make_interval(days => p_days);

  UPDATE public.profiles
     SET plan = 'pro'::plan_type,
         trial_ends_at = v_ends
   WHERE id = p_target;

  PERFORM public.write_audit_log('trial_granted', p_target,
    jsonb_build_object('trial_ends_at', v_ends, 'plan', 'pro', 'days', p_days));

  RETURN v_ends;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_suspended(p_target uuid, p_suspend boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.profiles
     SET suspended_at = CASE WHEN p_suspend THEN now() ELSE NULL END
   WHERE id = p_target;

  PERFORM public.write_audit_log(
    CASE WHEN p_suspend THEN 'user_suspended' ELSE 'user_unsuspended' END,
    p_target, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_admin_role(p_target uuid, p_make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current admin_role;
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT admin_role INTO v_current FROM public.profiles WHERE id = p_target;

  -- a super admin is never created or removed through this entry point
  IF v_current = 'super_admin'::admin_role THEN
    RAISE EXCEPTION 'cannot modify a super admin';
  END IF;

  IF p_target = auth.uid() THEN
    RAISE EXCEPTION 'cannot change your own admin rights';
  END IF;

  UPDATE public.profiles
     SET is_admin = p_make_admin,
         admin_role = CASE WHEN p_make_admin THEN 'admin'::admin_role ELSE NULL END
   WHERE id = p_target;

  PERFORM public.write_audit_log(
    CASE WHEN p_make_admin THEN 'admin_promoted' ELSE 'admin_demoted' END,
    p_target, jsonb_build_object('previous_role', v_current));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_target = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete your own account';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = p_target AND admin_role = 'super_admin'::admin_role
  ) THEN
    RAISE EXCEPTION 'cannot delete a super admin';
  END IF;

  PERFORM public.write_audit_log('user_deleted_rgpd', p_target, '{}'::jsonb);
  DELETE FROM public.profiles WHERE id = p_target;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_start_impersonation(p_target uuid)
RETURNS TABLE (session_id uuid, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_expires timestamptz;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_target = auth.uid() THEN
    RAISE EXCEPTION 'cannot view your own account this way';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target) THEN
    RAISE EXCEPTION 'unknown account';
  END IF;

  -- close any session this admin left open
  UPDATE public.admin_impersonation_sessions
     SET ended_at = now()
   WHERE admin_id = auth.uid() AND ended_at IS NULL;

  v_expires := now() + interval '30 minutes';

  INSERT INTO public.admin_impersonation_sessions (admin_id, target_user_id, expires_at)
  VALUES (auth.uid(), p_target, v_expires)
  RETURNING id INTO v_id;

  PERFORM public.write_audit_log('impersonation_start', p_target,
    jsonb_build_object('session_id', v_id, 'expires_at', v_expires));

  RETURN QUERY SELECT v_id, v_expires;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_end_impersonation(p_session uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.admin_impersonation_sessions
     SET ended_at = now()
   WHERE id = p_session
     AND admin_id = auth.uid()
     AND ended_at IS NULL
  RETURNING target_user_id INTO v_target;

  IF v_target IS NOT NULL THEN
    PERFORM public.write_audit_log('impersonation_end', v_target,
      jsonb_build_object('session_id', p_session));
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_plan(uuid, plan_type) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_grant_trial(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_suspended(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_admin_role(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_start_impersonation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_end_impersonation(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(uuid, plan_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_trial(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_suspended(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_start_impersonation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_end_impersonation(uuid) TO authenticated;
