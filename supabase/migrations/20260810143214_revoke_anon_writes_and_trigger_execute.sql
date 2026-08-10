-- Defense in depth: the anonymous role has no legitimate write path to business data.
-- RLS already blocks it (predicates are keyed on auth.uid()), this removes the grant too.
REVOKE INSERT, UPDATE, DELETE ON public.clients FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.companies FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.plans FROM anon;

-- Quota trigger functions must never be invocable outside a trigger context.
REVOKE ALL ON FUNCTION public.enforce_invoice_quota() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_client_quota() FROM PUBLIC, anon, authenticated;
