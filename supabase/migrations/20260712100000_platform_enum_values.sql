-- Enum values used by the platform mechanics migration.
-- Kept separate so PostgreSQL can commit enum additions before later SQL uses them.

alter type public.cleaner_status add value if not exists 'in_training' after 'pending';
alter type public.cleaner_status add value if not exists 'certified' after 'in_training';
alter type public.cleaner_tier add value if not exists 'rose_gold' after 'gold';
alter type public.booking_status add value if not exists 'awaiting_customer_confirmation' after 'in_progress';
