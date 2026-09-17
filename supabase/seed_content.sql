-- Mundoria Mag + Help Centre seed content (safe to re-run)

begin;

delete from public.help_articles;
delete from public.help_collections;
delete from public.blog_posts;

insert into public.help_collections (id, title, slug, description, audience, sort_order) values
  ('11111111-1111-4111-8111-111111111101', 'For customers', 'for-customers', 'Booking, payments, cancellations and getting the most from your clean.', 'customers', 10),
  ('11111111-1111-4111-8111-111111111102', 'Become a Mundoria cleaner', 'become-a-cleaner', 'How to apply, documents we need, and what happens after you sign up.', 'cleaners', 20),
  ('11111111-1111-4111-8111-111111111103', 'Cleaner guide', 'cleaner-guide', 'Jobs, checklists, messaging and payouts once you are live.', 'cleaners', 30);

insert into public.help_articles (collection_id, title, slug, summary, body, sort_order) values
(
  '11111111-1111-4111-8111-111111111101',
  'How do I book a cleaner on Mundoria?',
  'how-do-i-book',
  'From postcode to payment in a few guided steps.',
  E'## Book in minutes\n- Open Book a clean and enter your postcode.\n- Choose a service and cleaning standard.\n- Add rooms or commercial spaces, duration and add-ons.\n- Pick a date and time, then pay securely.\n\n## After you book\nWe match a suitable cleaner. You will see live status through arrival, checklist completion and confirmation.\n\n> Tip: for Recovery cleans, use the Preferences step to share fragrance-free and priority-room notes.',
  10
),
(
  '11111111-1111-4111-8111-111111111101',
  'How does payment and cancellation work?',
  'payment-and-cancellation',
  'We hold payment at booking and capture after the clean.',
  E'## Payment hold\nMundoria authorises (holds) your card when you book. Funds are captured after the job is completed — not days early.\n\n## Cancellation fees\n- More than 48 hours before: usually free full release.\n- Within 48 hours: a partial fee may apply.\n- Within 24 hours: the full amount may be retained.\n\nExact timing is based on your scheduled start.',
  20
),
(
  '11111111-1111-4111-8111-111111111101',
  'How do I message my cleaner?',
  'how-do-i-message-my-cleaner',
  'In-app messaging after a cleaner is matched.',
  E'## When messaging unlocks\nYou can message once a cleaner is assigned to your booking.\n\n## Where to find chat\nOpen the booking in your account and use Messages. Keep all communication on Mundoria — do not share personal phone numbers for off-platform payments.',
  30
),
(
  '11111111-1111-4111-8111-111111111102',
  'How do I partner with Mundoria?',
  'how-do-i-partner',
  'Sign up, complete onboarding, upload documents, wait for approval.',
  E'## Steps\n- Create a cleaner account.\n- Complete the onboarding wizard (services, areas, availability).\n- Upload identity and DBS documents.\n- Connect Stripe Express for payouts.\n- Wait for admin review before jobs appear.\n\n## What we look for\nReliability, clear communication, and documents that pass review. Experience helps but a strong willingness to deliver quality service matters too.',
  10
),
(
  '11111111-1111-4111-8111-111111111102',
  'What documents do I need?',
  'cleaner-documents',
  'ID, DBS and right-to-work evidence where applicable.',
  E'## Required\n- Photo ID (passport or driving licence).\n- Clear DBS check.\n- Headshot for your profile.\n- If you are not a British or Irish national: right-to-work evidence.\n\n## Tax status\nIndependent cleaners should be registered as self-employed with HMRC. Mundoria may ask for your UTR as part of compliance before you accept paid jobs.',
  20
),
(
  '11111111-1111-4111-8111-111111111103',
  'How do job offers and checklists work?',
  'job-offers-and-checklists',
  'Respond promptly, follow the checklist, check in and out on site.',
  E'## Job offers\nEligible jobs appear in your feed. Respond quickly — slow replies mean the customer may be matched elsewhere.\n\n## On the day\n- Travel to the address and check in within the geofence.\n- Complete the service checklist and upload photos if required.\n- Check out when finished so payment can be captured.',
  10
);

-- Mundoria Mag posts (covers + full articles): prefer
--   node --env-file=.env.local scripts/seed-content.mjs
-- which loads scripts/mag-posts.mjs (19 diverse articles with images).

commit;

