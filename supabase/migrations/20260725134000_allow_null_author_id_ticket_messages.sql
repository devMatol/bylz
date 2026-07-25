-- Migration: Allow null author_id on ticket_messages for unauthenticated guest support messages

ALTER TABLE ticket_messages ALTER COLUMN author_id DROP NOT NULL;
