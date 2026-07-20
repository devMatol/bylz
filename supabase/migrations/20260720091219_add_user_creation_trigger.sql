/*
# Auto-create profile on user signup (all auth providers)

## Why
Previously, a `profiles` row was only created in the email/password signup
code path (SignupPage.tsx) via a manual client-side insert. Google OAuth
signups (and any future auth provider) never created a profile row, so the
later `companies` insert failed with FK violation 23503 ("Key is not present
in table profiles").

## What this migration does
1. Creates a `SECURITY DEFINER` trigger function `public.handle_new_user()`
   that inserts a `profiles` row (id, email, plan='starter') for every new
   `auth.users` row, with `ON CONFLICT (id) DO NOTHING` so it is idempotent.
2. Attaches it as an `AFTER INSERT` trigger on `auth.users` named
   `on_auth_user_created`. This runs for ALL auth providers (email/password,
   Google OAuth, magic link, etc.) — current and future.
3. Backfills any existing `auth.users` that are missing a `profiles` row
   (e.g. Google users already signed up before this trigger existed).

## Security
- The trigger function is `SECURITY DEFINER` with `search_path = public` so
  it can write to `public.profiles` regardless of the calling role. It only
  inserts a minimal row derived from `auth.users` (id, email) — no
  user-controlled input is trusted.
- No RLS policy changes: `profiles` already has an owner-scoped policy.

## Notes
1. The client-side manual `profiles` insert in SignupPage.tsx is now
   redundant and will be removed from the frontend code. The trigger is the
   single source of truth for profile creation.
2. The trigger is synchronous (AFTER INSERT, same transaction), so the
   profile row exists by the time the auth response returns to the client.
   AuthContext still keeps a one-shot 500ms retry as a defensive guard.
*/

-- 1. Trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan)
  VALUES (new.id, new.email, 'starter')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 2. Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill existing users missing a profile
INSERT INTO public.profiles (id, email, plan)
SELECT id, email, 'starter' FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
