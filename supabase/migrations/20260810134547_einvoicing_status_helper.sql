-- The integration status row holds an access token, so users must not read it.
-- They only need to know whether e-invoicing is currently available.
CREATE OR REPLACE FUNCTION public.einvoicing_token_valid()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT s.token_valid FROM public.factpulse_status s WHERE s.id = 'default'), true);
$$;

REVOKE ALL ON FUNCTION public.einvoicing_token_valid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.einvoicing_token_valid() TO authenticated;
