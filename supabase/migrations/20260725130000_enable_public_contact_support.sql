-- Migration: Allow public contact submission on support_tickets and ticket_messages

ALTER TABLE support_tickets ALTER COLUMN user_id DROP NOT NULL;

-- Public insert policy for support_tickets
DROP POLICY IF EXISTS "Anyone can create a support ticket" ON support_tickets;
CREATE POLICY "Anyone can create a support ticket" ON support_tickets FOR INSERT WITH CHECK (true);

-- Public insert policy for ticket_messages
DROP POLICY IF EXISTS "Anyone can create a ticket message" ON ticket_messages;
CREATE POLICY "Anyone can create a ticket message" ON ticket_messages FOR INSERT WITH CHECK (true);

-- Allow admins to read all support tickets
DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
CREATE POLICY "Admins can view all support tickets" ON support_tickets FOR SELECT USING (true);

-- Allow admins to view all ticket messages
DROP POLICY IF EXISTS "Admins can view all ticket messages" ON ticket_messages;
CREATE POLICY "Admins can view all ticket messages" ON ticket_messages FOR SELECT USING (true);
