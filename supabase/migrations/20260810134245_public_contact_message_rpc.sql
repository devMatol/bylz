-- The public contact form no longer writes tables directly: a definer function
-- creates the ticket and its first message with validated, length-bounded input.
ALTER TABLE public.ticket_messages ALTER COLUMN author_id DROP NOT NULL;

DROP POLICY IF EXISTS "support_tickets_insert_public" ON public.support_tickets;
REVOKE INSERT ON TABLE public.support_tickets FROM anon;

CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ticket uuid;
  v_uid uuid := auth.uid();
  v_body text;
BEGIN
  IF p_message IS NULL OR length(btrim(p_message)) = 0 THEN
    RAISE EXCEPTION 'message required';
  END IF;
  IF length(p_message) > 5000 THEN
    RAISE EXCEPTION 'message too long';
  END IF;
  IF p_email IS NOT NULL AND p_email <> '' AND p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'invalid email';
  END IF;

  v_body := 'Nom: ' || left(btrim(COALESCE(p_name, '')), 200) || E'\n'
         || 'Email: ' || left(btrim(COALESCE(p_email, '')), 200) || E'\n\n'
         || left(btrim(p_message), 5000);

  INSERT INTO public.support_tickets (user_id, subject, category, priority, status)
  VALUES (
    v_uid,
    left(NULLIF(btrim(COALESCE(p_subject, '')), ''), 200),
    'question',
    'normal',
    'open'
  )
  RETURNING id INTO v_ticket;

  INSERT INTO public.ticket_messages (ticket_id, author_id, body)
  VALUES (v_ticket, v_uid, v_body);

  RETURN v_ticket;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contact_message(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(text, text, text, text) TO anon, authenticated;
