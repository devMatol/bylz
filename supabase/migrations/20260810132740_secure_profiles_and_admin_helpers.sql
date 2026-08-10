/*
  # Secure account records and add admin helper

  1. Helper functions
     - `public.is_platform_admin()` returns whether the caller is a platform admin.
       SECURITY DEFINER so it can read `profiles` without triggering the recursive
       policy evaluation that made the previous admin policies unusable.
     - `public.is_platform_super_admin()` same, for super-admin-only capabilities.
  2. Row level security
     - Enable RLS on `profiles` (it was created with policies but RLS switched off,
       so every policy was inert and the raw grants applied).
     - Replace the `FOR ALL` self policy and the two always-true admin policies
       with one policy per command.
  3. Privileges
     - `anon` loses all access to `profiles`.
     - `authenticated` may only UPDATE the two columns a user legitimately owns,
       so `is_admin`, `admin_role`, `plan`, `trial_*` and the Stripe ids can no
       longer be self-assigned. Privileged changes go through definer RPCs.
*/

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin AND p.admin_role = 'super_admin'::admin_role
       FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_platform_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_super_admin() TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (accountant_email, tmi) ON TABLE public.profiles TO authenticated;
