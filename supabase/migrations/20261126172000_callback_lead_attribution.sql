-- Where a callback request really came from: the first ad visit the browser
-- remembered (UTMs incl. term/content, gclid, fbclid, referrer, landing page),
-- even when the form was sent from a later page without UTMs in the URL.
alter table public.callback_leads
  add column if not exists attribution jsonb;
