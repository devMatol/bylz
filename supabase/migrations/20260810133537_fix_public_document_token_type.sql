-- public_token is a uuid: match on uuid equality, and reject anything that is
-- not a well formed uuid outright.
CREATE OR REPLACE FUNCTION public.get_public_document(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uuid uuid;
  v_result jsonb;
BEGIN
  BEGIN
    v_uuid := p_token::uuid;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;

  SELECT jsonb_build_object(
    'type', 'quote',
    'id', q.id,
    'number', q.number,
    'status', q.status,
    'issue_date', q.issue_date,
    'due_or_validity_date', q.validity_date,
    'total_ht', q.total_ht,
    'total_vat', q.total_vat,
    'total_ttc', q.total_ttc,
    'note', q.note,
    'stripe_payment_link', NULL,
    'signature_data', q.signature_data,
    'company', jsonb_build_object(
      'legal_name', co.legal_name,
      'commercial_name', co.commercial_name,
      'siret', co.siret,
      'address', co.address,
      'logo_url', co.logo_url,
      'invoice_footer', co.invoice_footer,
      'accent_color', co.accent_color,
      'user_id', co.user_id,
      'stripe_connect_account_id', co.stripe_connect_account_id,
      'plan', COALESCE(pr.plan::text, 'starter')
    ),
    'client', jsonb_build_object(
      'name', cl.name,
      'email', cl.email,
      'address', cl.address,
      'siret', cl.siret
    ),
    'lines', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'description', l.description,
        'quantity', l.quantity,
        'unit_price', l.unit_price,
        'nature', l.nature
      ) ORDER BY l.position)
      FROM public.quote_lines l WHERE l.quote_id = q.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM public.quotes q
  JOIN public.companies co ON co.id = q.company_id
  LEFT JOIN public.clients cl ON cl.id = q.client_id
  LEFT JOIN public.profiles pr ON pr.id = co.user_id
  WHERE q.public_token = v_uuid OR q.id = v_uuid
  LIMIT 1;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  SELECT jsonb_build_object(
    'type', 'invoice',
    'id', i.id,
    'number', i.number,
    'status', i.status,
    'issue_date', i.issue_date,
    'due_or_validity_date', i.due_date,
    'total_ht', i.total_ht,
    'total_vat', i.total_vat,
    'total_ttc', i.total_ttc,
    'note', i.note,
    'stripe_payment_link', i.stripe_payment_link,
    'signature_data', i.signature_data,
    'company', jsonb_build_object(
      'legal_name', co.legal_name,
      'commercial_name', co.commercial_name,
      'siret', co.siret,
      'address', co.address,
      'logo_url', co.logo_url,
      'invoice_footer', co.invoice_footer,
      'accent_color', co.accent_color,
      'user_id', co.user_id,
      'stripe_connect_account_id', co.stripe_connect_account_id,
      'plan', COALESCE(pr.plan::text, 'starter')
    ),
    'client', jsonb_build_object(
      'name', cl.name,
      'email', cl.email,
      'address', cl.address,
      'siret', cl.siret
    ),
    'lines', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'description', l.description,
        'quantity', l.quantity,
        'unit_price', l.unit_price,
        'nature', l.nature
      ) ORDER BY l.position)
      FROM public.invoice_lines l WHERE l.invoice_id = i.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM public.invoices i
  JOIN public.companies co ON co.id = i.company_id
  LEFT JOIN public.clients cl ON cl.id = i.client_id
  LEFT JOIN public.profiles pr ON pr.id = co.user_id
  WHERE i.public_token = v_uuid OR i.id = v_uuid
  LIMIT 1;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.sign_public_document(
  p_token text,
  p_signer_name text,
  p_signer_email text,
  p_signature_image text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uuid uuid;
  v_id uuid;
  v_payload jsonb;
BEGIN
  BEGIN
    v_uuid := p_token::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'document not found';
  END;

  IF p_signer_name IS NULL OR length(btrim(p_signer_name)) = 0 THEN
    RAISE EXCEPTION 'signer name required';
  END IF;
  IF length(COALESCE(p_signature_image, '')) > 500000 THEN
    RAISE EXCEPTION 'signature too large';
  END IF;

  v_payload := jsonb_build_object(
    'signer_name', left(btrim(p_signer_name), 200),
    'signer_email', left(btrim(COALESCE(p_signer_email, '')), 200),
    'signed_at', now(),
    'signature_image', COALESCE(p_signature_image, '')
  );

  UPDATE public.quotes q
     SET status = 'accepted',
         signature_data = v_payload
   WHERE (q.public_token = v_uuid OR q.id = v_uuid)
     AND q.signature_data IS NULL
     AND q.status <> 'accepted'
  RETURNING q.id INTO v_id;

  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('type', 'quote', 'id', v_id);
  END IF;

  UPDATE public.invoices i
     SET status = 'signed',
         signature_data = v_payload
   WHERE (i.public_token = v_uuid OR i.id = v_uuid)
     AND i.signature_data IS NULL
     AND i.status <> 'signed'
  RETURNING i.id INTO v_id;

  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('type', 'invoice', 'id', v_id);
  END IF;

  RAISE EXCEPTION 'document not found or already signed';
END;
$$;
