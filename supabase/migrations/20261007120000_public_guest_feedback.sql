-- Anyone can leave a written review from the public page, with no booking.

alter table public.guest_feedback alter column token_hash drop not null;
alter table public.guest_feedback alter column service_label drop not null;
alter table public.guest_feedback alter column service_date drop not null;
alter table public.guest_feedback alter column mood drop not null;

alter table public.guest_feedback drop constraint if exists guest_feedback_comment_check;
alter table public.guest_feedback
  add constraint guest_feedback_comment_check
  check (comment is null or char_length(comment) between 1 and 2000);
