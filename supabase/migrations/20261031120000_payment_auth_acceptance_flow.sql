-- Enum must commit before it can be referenced in indexes/functions
-- (Postgres: unsafe use of new enum value in the same transaction).

alter type public.booking_status add value if not exists 'awaiting_payment' after 'matched';
