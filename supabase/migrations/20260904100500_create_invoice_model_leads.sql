-- Migration: Create invoice_model_leads table & RPC for lead generation from invoice templates

CREATE TABLE IF NOT EXISTS public.invoice_model_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  source_url TEXT,
  template_type TEXT DEFAULT 'auto_entrepreneur',
  invoice_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for querying leads by email & date
CREATE INDEX IF NOT EXISTS idx_invoice_model_leads_email ON public.invoice_model_leads (email);
CREATE INDEX IF NOT EXISTS idx_invoice_model_leads_created_at ON public.invoice_model_leads (created_at DESC);

-- Enable RLS
ALTER TABLE public.invoice_model_leads ENABLE ROW LEVEL SECURITY;

-- Allow admins full access
CREATE POLICY "Admins can view and manage invoice leads"
  ON public.invoice_model_leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RPC for secure anonymous lead submission
CREATE OR REPLACE FUNCTION public.submit_invoice_lead(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_source_url TEXT DEFAULT NULL,
  p_template_type TEXT DEFAULT 'auto_entrepreneur',
  p_invoice_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id UUID;
  v_clean_email TEXT;
BEGIN
  v_clean_email := lower(trim(p_email));

  -- Basic email validation
  IF v_clean_email IS NULL OR v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Format d''email invalide');
  END IF;

  INSERT INTO public.invoice_model_leads (
    email,
    name,
    source_url,
    template_type,
    invoice_data
  )
  VALUES (
    v_clean_email,
    nullif(trim(p_name), ''),
    nullif(trim(p_source_url), ''),
    coalesce(p_template_type, 'auto_entrepreneur'),
    coalesce(p_invoice_data, '{}'::jsonb)
  )
  RETURNING id INTO v_lead_id;

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'message', 'Lead enregistré avec succès'
  );
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.submit_invoice_lead(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
