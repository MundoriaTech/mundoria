-- Phones saved with the UK dial code twice ("+44 44 7835 710430") by the old
-- callback form, which added +44 to a number the person had typed with 44.
-- Only numbers that are exactly 44 + 44 + a full 10-digit UK number change.

update public.callback_leads
set phone = '+44 ' || substr(regexp_replace(phone, '\D', '', 'g'), 5)
where regexp_replace(phone, '\D', '', 'g') ~ '^4444[1-9][0-9]{9}$';

update public.leads
set phone = '+44' || substr(regexp_replace(phone, '\D', '', 'g'), 5),
    updated_at = now()
where phone is not null
  and regexp_replace(phone, '\D', '', 'g') ~ '^4444[1-9][0-9]{9}$';

update public.profiles
set phone = '+44 ' || substr(regexp_replace(phone, '\D', '', 'g'), 5)
where phone is not null
  and regexp_replace(phone, '\D', '', 'g') ~ '^4444[1-9][0-9]{9}$';
