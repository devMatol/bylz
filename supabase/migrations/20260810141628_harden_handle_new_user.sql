/*
  # Harden the new-user trigger function

  `public.handle_new_user()` is SECURITY DEFINER with no pinned search_path,
  so an object created earlier in the resolution path could be executed with the
  function owner's rights. It is also EXECUTE-able by every role by default.

  1. Changes
     - pin `search_path = public, pg_temp`
     - revoke EXECUTE from PUBLIC (the trigger itself does not need a grant)
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, is_admin, created_at)
  VALUES (new.id, new.email, 'starter', false, new.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
