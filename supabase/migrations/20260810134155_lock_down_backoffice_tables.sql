-- F13: blog writing was open to anyone with the published API key
-- ("Admins manage blog_posts" had a predicate of literally `true` for role public).
DROP POLICY IF EXISTS "Admins full access on blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins manage blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Public view published" ON public.blog_posts;
DROP POLICY IF EXISTS "Public view published blog posts" ON public.blog_posts;

CREATE POLICY "blog_posts_select_published" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "blog_posts_select_admin" ON public.blog_posts
  FOR SELECT TO authenticated USING (public.is_platform_admin());
CREATE POLICY "blog_posts_insert_admin" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY "blog_posts_update_admin" ON public.blog_posts
  FOR UPDATE TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "blog_posts_delete_admin" ON public.blog_posts
  FOR DELETE TO authenticated USING (public.is_platform_admin());

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.blog_posts FROM anon;

-- F14 / F15: every support conversation on the platform was readable and
-- deletable by anyone holding the published API key.
DROP POLICY IF EXISTS "Public support tickets select" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can delete support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Public support tickets insert" ON public.support_tickets;
DROP POLICY IF EXISTS "own tickets" ON public.support_tickets;

CREATE POLICY "support_tickets_select_own" ON public.support_tickets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "support_tickets_select_admin" ON public.support_tickets
  FOR SELECT TO authenticated USING (public.is_platform_admin());
-- Signed-in users open tickets under their own identity; the public contact
-- form (anonymous) may only create an unowned ticket.
CREATE POLICY "support_tickets_insert_own" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "support_tickets_insert_public" ON public.support_tickets
  FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "support_tickets_update_own" ON public.support_tickets
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "support_tickets_update_admin" ON public.support_tickets
  FOR UPDATE TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "support_tickets_delete_admin" ON public.support_tickets
  FOR DELETE TO authenticated USING (public.is_platform_admin());

REVOKE ALL ON TABLE public.support_tickets FROM anon;
GRANT INSERT ON TABLE public.support_tickets TO anon;

DROP POLICY IF EXISTS "Public ticket messages select" ON public.ticket_messages;
DROP POLICY IF EXISTS "Anyone can delete ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Public ticket messages insert" ON public.ticket_messages;
DROP POLICY IF EXISTS "own ticket messages" ON public.ticket_messages;

CREATE POLICY "ticket_messages_select_own" ON public.ticket_messages
  FOR SELECT TO authenticated USING (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
  );
CREATE POLICY "ticket_messages_select_admin" ON public.ticket_messages
  FOR SELECT TO authenticated USING (public.is_platform_admin());
CREATE POLICY "ticket_messages_insert_own" ON public.ticket_messages
  FOR INSERT TO authenticated WITH CHECK (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
  );
CREATE POLICY "ticket_messages_insert_admin" ON public.ticket_messages
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY "ticket_messages_delete_admin" ON public.ticket_messages
  FOR DELETE TO authenticated USING (public.is_platform_admin());

REVOKE ALL ON TABLE public.ticket_messages FROM anon;

-- F16: system settings (integration configuration) were world readable and
-- world writable through the API.
DROP POLICY IF EXISTS "Admins manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Public read system settings" ON public.system_settings;

CREATE POLICY "system_settings_select_admin" ON public.system_settings
  FOR SELECT TO authenticated USING (public.is_platform_admin());
CREATE POLICY "system_settings_insert_admin" ON public.system_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY "system_settings_update_admin" ON public.system_settings
  FOR UPDATE TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "system_settings_delete_admin" ON public.system_settings
  FOR DELETE TO authenticated USING (public.is_platform_admin());

REVOKE ALL ON TABLE public.system_settings FROM anon;

-- F17: the sent-email record (recipients and content) was world readable and
-- anyone could forge entries in it.
DROP POLICY IF EXISTS "Admins read email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Anyone insert email logs" ON public.email_logs;

CREATE POLICY "email_logs_select_admin" ON public.email_logs
  FOR SELECT TO authenticated USING (public.is_platform_admin());

REVOKE ALL ON TABLE public.email_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.email_logs FROM authenticated;

-- F18: integration status was world readable and its write policy depended on a
-- profiles lookup that users could previously satisfy themselves.
DROP POLICY IF EXISTS "Admins read factpulse_status" ON public.factpulse_status;
DROP POLICY IF EXISTS "Admins manage factpulse_status" ON public.factpulse_status;

CREATE POLICY "factpulse_status_select_admin" ON public.factpulse_status
  FOR SELECT TO authenticated USING (public.is_platform_admin());
CREATE POLICY "factpulse_status_insert_admin" ON public.factpulse_status
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY "factpulse_status_update_admin" ON public.factpulse_status
  FOR UPDATE TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "factpulse_status_delete_admin" ON public.factpulse_status
  FOR DELETE TO authenticated USING (public.is_platform_admin());

REVOKE ALL ON TABLE public.factpulse_status FROM anon;
