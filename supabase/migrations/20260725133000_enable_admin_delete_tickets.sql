-- Migration: Grant DELETE RLS policy for support_tickets and ticket_messages

DROP POLICY IF EXISTS "Anyone can delete support tickets" ON support_tickets;
CREATE POLICY "Anyone can delete support tickets" ON support_tickets FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can delete ticket messages" ON ticket_messages;
CREATE POLICY "Anyone can delete ticket messages" ON ticket_messages FOR DELETE USING (true);
