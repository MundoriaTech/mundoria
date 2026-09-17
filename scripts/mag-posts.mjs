/**
 * Mundoria Mag seed posts — WeCasa-style guides + Unsplash stock covers.
 * Imported by scripts/seed-content.mjs
 */

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const IMG = {
  bedding: "/images/mag/bedding.jpg",
  bedroom: "/images/mag/bedroom.jpg",
  cash: "/images/mag/cash-to-app.jpg",
  cleaner: "/images/mag/cleaner-portrait.jpg",
  empty: "/images/mag/empty-flat.jpg",
  fiveStar: "/images/mag/five-star.jpg",
  fragrance: "/images/mag/fragrance-free.jpg",
  harborne: "/images/mag/harborne-home.jpg",
  hours: "/images/mag/cleaner-2hrs.jpg",
  kitchen: "/images/mag/kitchen.jpg",
  moveIn: "/images/mag/move-in.jpg",
  office: "/images/mag/home-office.jpg",
  prepare: "/images/mag/prepare-home.jpg",
  recovery: "/images/mag/recovery.jpg",
  recurring: "/images/mag/recurring.jpg",
  sameDay: "/images/mag/same-day.jpg",
  shortlet: "/images/mag/shortlet.jpg",
  welcome: "/images/mag/welcome-mag.jpg",
  wood: "/images/mag/wooden-detail.jpg",
};

export const MAG_POSTS = [
  {
    author_name: "Aisha O.",
    category: "Cleaning Tips",
    content: `Is your flat starting to look tired, but you only have a short window before guests arrive? You’re not alone. A focused two-hour clean can transform a home — as long as you know what realistically fits, and what doesn’t.

Below, you’ll find a practical guide to what a Mundoria cleaner can usually complete in 120 minutes, how to brief the visit, and when you should book longer.

## What Usually Fits in Two Hours?

Most Birmingham flats and smaller terraces respond brilliantly to a tight two-hour visit. The goal isn’t to deep-clean every cupboard — it’s to make the home feel reset where it matters most.

Here’s what typically fits:

1. Kitchen surfaces, hob, sink and a quick appliance wipe
2. One bathroom — basin, toilet, shower or bath surround, and the floor
3. Living-room floors plus high-touch surfaces
4. A tidy vacuum or mop pass through corridors

## What Rarely Fits?

Moving heavy furniture, oven interiors, inside every cupboard, loft spaces, or a full end-of-tenancy standard almost never fit into two hours. Those need a longer booking or a dedicated deep-clean service.

| Job type | Usually fits in 2 hours? |
| --- | --- |
| Flat tidy + kitchen + one bathroom | Yes |
| Family home with pets | Often needs 3+ hours |
| Oven interior + fridge interior | No — book a deep clean |
| End of tenancy / inventory ready | No — book end-of-tenancy |

## In What Order Should the Cleaner Work?

The golden rule is **top to bottom, dry to wet**. Dust and crumbs fall downward, so floors come last.

1. Declutter walkways if needed
2. Kitchen surfaces and splashbacks
3. Bathroom sanitise
4. Living areas and touch points
5. Floors and corridors

> **Pro Tip:** Clear floors and the sink the night before. Ten minutes of your time can unlock twenty minutes of actual cleaning.

## How Should You Brief Your Cleaner?

Use the booking notes to name your **top three priorities**. Mundoria checklists keep the visit structured so time goes into cleaning, not guessing. If fragrance-free products matter, say so in preferences.

## When Should You Book Longer?

Family homes with pets, post-party kitchens, or Recovery visits with mobility notes often need three hours or more. If you’re unsure, start with the estimate Mundoria shows and add time before you confirm.

If you’d rather not race the clock yourself, [book a cleaner](/booking/new) and we’ll match someone who can fulfil in your area — with a clear estimate before you pay.`,
    cover_url: IMG.hours,
    excerpt:
      "Your home, sorted in no time — what realistically fits in a focused two-hour Mundoria visit (and what doesn’t).",
    published: true,
    published_at: daysAgo(1),
    slug: "what-can-a-cleaner-do-in-2-hours",
    title: "What can a cleaner do in 2 hours?",
  },
  {
    author_name: "Mundoria Team",
    category: "Home Care",
    content: `Is your bedroom starting to feel more chaotic than calming? You’re not alone. Between busy schedules and everyday life, bedrooms collect clutter, dust and laundry faster than almost any other room.

The good news: with a solid bedroom cleaning checklist, keeping your space fresh becomes second nature — no marathon sessions required. Below you’ll find a daily routine, a weekly clean, and a monthly deep-clean plan.

## In What Order Should You Clean Your Bedroom?

Work from **top to bottom** so dust that falls gets picked up when you do the floor.

1. Declutter — rubbish, stray items and dirty clothes
2. Strip the bed — sheets and pillowcases
3. Dust surfaces — from light fixtures down to nightstands
4. Wipe and sanitise — mirrors, switches, door handles
5. Vacuum or mop — including under the bed
6. Make the bed — with fresh bedding

![A freshly made bed is the fastest way to make a bedroom feel finished.](/images/mag/bedroom-made.jpg "A made bed resets the whole room in under two minutes.")

## Your Daily Bedroom Cleaning Checklist

A daily routine doesn’t need more than five to ten minutes. The goal is simply to stop clutter building up.

| Daily task | Time needed |
| --- | --- |
| Make the bed | 2 minutes |
| Put clothes away or in the laundry basket | 3 minutes |
| Clear nightstand and dresser | 2 minutes |
| Remove cups and rubbish | 1 minute |
| Open a window for fresh air | 30 seconds |

## Weekly Bedroom Cleaning Checklist

Once a week, set aside around 30 minutes for a proper reset.

- Strip the bed and wash sheets and pillowcases
- Dust nightstands, dressers, shelves and frames with a microfibre cloth
- Clean mirrors with glass cleaner or diluted white vinegar
- Sanitise light switches, door handles and remotes
- Vacuum floors, including under the bed and along skirting
- Dust electronics with a dry cloth

| Weekly task | Supplies needed |
| --- | --- |
| Wash bedding | Laundry detergent |
| Dust surfaces | Microfibre cloth |
| Clean mirrors | Glass cleaner or vinegar solution |
| Vacuum floors | Vacuum with edge attachments |

![A simple cloth-and-cleaner kit keeps the weekly bedroom pass quick.](/images/mag/supplies.jpg "Keep cloths and glass cleaner together so you are not hunting mid-clean.")

## Monthly Deep Cleaning Bedroom Tasks

Block out 60–90 minutes once a month for the jobs a weekly tidy can’t reach.

- Vacuum and rotate the mattress
- Wash pillows and mattress protectors (check care labels)
- Dust curtains or wipe blinds
- Dust ceiling fixtures
- Spot-clean wall marks
- Wipe windowsills and frames
- Declutter one drawer or wardrobe section

## What Are the Rules of Smart Bedroom Cleaning?

1. Clean from top to bottom — dust falls downward
2. Let products sit briefly before scrubbing
3. Tackle spills straight away
4. Ventilate when using sprays
5. Stay consistent — a little daily effort beats a huge monthly panic

> **Pro Tip:** Always start with the corner that feels most overwhelming. Momentum does half the work.

If you’d rather keep the deep cleans off your weekend, [book a Mundoria cleaner](/booking/new) and keep the daily habits for yourself.`,
    cover_url: IMG.bedroom,
    excerpt:
      "A complete daily, weekly and monthly bedroom cleaning checklist — so your sleep space stays calm without marathon sessions.",
    published: true,
    published_at: daysAgo(2),
    slug: "bedroom-cleaning-checklist",
    title: "Bedroom cleaning checklist: daily, weekly and monthly",
  },
  {
    author_name: "Jess M.",
    category: "Home Care",
    content: `Wooden furniture brings warmth into a home — and UK central heating loves drying it out. Harsh sprays leave haze; too much water raises the grain. The good news is that everyday care is simple once you know the rules.

This complete UK-friendly guide covers weekly dusting, deeper refreshes, natural recipes, and what to avoid.

## What’s the Best Everyday Cleaner for Wood?

For most **finished** wood, warm water with a few drops of mild washing-up liquid is all you need. Dip a soft cloth, wring it until it’s damp — not wet — and wipe gently along the grain. Dry immediately with a clean cloth.

Never soak the surface. Moisture left sitting on wood is what causes rings, swelling and dull patches.

![Wipe wooden furniture along the grain with a barely damp cloth, then dry straight away.](/images/mag/wood-wipe.jpg "Damp — not wet — and always dry immediately.")

## How Often Should You Dust Wooden Furniture?

Aim to dust at least once a week with a soft, lint-free microfibre cloth. Regular dusting stops grit scratching the finish. Homes with children or pets may need more frequent passes.

## Can You Use Vinegar on Wooden Furniture?

White vinegar can work as a natural cleaner, but it must be diluted. Never apply undiluted vinegar — the acidity can damage certain finishes over time.

### Natural polish recipe

1. Mix one part white vinegar with three parts olive oil
2. Dip a soft cloth and wring out the excess
3. Wipe along the wood grain
4. Buff with a clean, dry cloth

> **Important:** Always test any solution on a hidden spot first — especially on antique, shellac or French-polish finishes.

## How Do You Remove Sticky Residue?

Sticky patches are often old polish buildup or spills. Dab a little olive oil on the area, leave for a few minutes, then wipe with a dry cloth. For tougher residue, a damp cloth with a drop of washing-up liquid usually helps — then dry straight away.

## What Should You Avoid?

- Bleach and antibacterial sprays
- Abrasive pads or scourers
- Undiluted vinegar
- Silicone polishes that build up and attract dust
- Leaving plant pots without coasters

## Pine and Painted Wood

Pine marks easily — spot-test cleaners underneath a shelf. Painted pieces usually prefer mild soap and water; never soak.

If you’d rather leave the careful work to someone else, Mundoria cleaners can dust and safely wipe finished furniture as part of a booking checklist — restoration and antique conservation stay with specialists.`,
    cover_url: IMG.wood,
    excerpt:
      "The complete UK-friendly guide to cleaning wooden furniture without raising the grain or dulling the finish.",
    published: true,
    published_at: daysAgo(3),
    slug: "how-to-clean-wooden-furniture",
    title: "How to clean wooden furniture: the complete UK guide",
  },
  {
    author_name: "Mundoria Team",
    category: "Cleaning Tips",
    content: `A greasy hob and sticky splashback can make the whole home feel unsettled — even when the rest of the house is fine. A kitchen deep clean doesn’t have to be overwhelming if you follow a clear sequence.

Here’s how to tackle it top to bottom, what usually fits in a Mundoria visit, and when to book extra time.

## What’s the Best Order for a Kitchen Deep Clean?

Work **top to bottom**, and leave the floor until last so you’re not walking dirt back in.

1. Clear and wipe cupboard fronts
2. Degrease hob, extractor and splashback
3. Clean sink, taps and draining board
4. Wipe appliance exteriors
5. Empty crumbs from toaster trays if accessible
6. Vacuum edges, then mop the floor

![A kitchen deep clean works best top to bottom — floors last so you are not walking dirt back in.](/images/mag/kitchen-sink.jpg "Clear the sink first so splashback and hob work stay efficient.")

## How Long Does a Kitchen Deep Clean Take?

A compact kitchen often fits into a two-hour visit alongside one bathroom. Large open-plan kitchens with islands may need three hours. Oven and fridge interiors usually need a deep-clean standard or an add-on.

| Kitchen size | Typical Mundoria timing |
| --- | --- |
| Compact flat kitchen | Often within 2 hours with a bathroom |
| Family kitchen + island | Plan 3 hours |
| Oven + fridge interiors | Deep-clean booking |

## What Prep Helps Most?

- Empty the dishwasher
- Clear the sink
- Put leftovers away
- Leave bin bags ready if you want rubbish taken out

> **Pro Tip:** Degreaser works better when you let it sit for a few minutes before wiping. Don’t scrub immediately.

## When Should You Book a Pro?

After festive cooking, before guests, or when grease has quietly built up for months. [Book a Mundoria clean](/booking/new), note “kitchen priority”, and we’ll show a clear estimate before you confirm.`,
    cover_url: IMG.kitchen,
    excerpt:
      "A practical kitchen deep-clean sequence — timing, prep tips, and when to book extra hours on Mundoria.",
    published: true,
    published_at: daysAgo(4),
    slug: "kitchen-deep-clean-without-the-stress",
    title: "Kitchen deep clean without the stress",
  },
  {
    author_name: "Priya S.",
    category: "Host Tips",
    content: `Should you wash new bedding before the first night? In most cases, **yes**. New sheets can carry finishing chemicals, dust and dye residues. A first wash makes them softer — and kinder to sensitive skin, especially for guest stays.

## Why Wash New Bedding First?

Manufacturers often treat fabrics so they look crisp on the shelf. Those finishes can irritate skin and leave a “new” smell that guests notice in reviews.

## How Should You Wash New Bedding?

1. Check the care label for temperature
2. Wash whites separately the first time
3. Use a mild detergent — skip heavy fragrance if guests have allergies
4. Dry fully before the first night

![Fresh bedding looks and feels better after a first wash — especially for guest stays.](/images/mag/linen-stack.jpg "Keep two full linen sets per bed for stress-free turnovers.")

## What About Airbnb and Short-Lets?

Keep at least **two full linen sets per bed** so one can wash while the other is in use. Mundoria turnovers go faster when linen is left ready and folded in a labelled cupboard.

> **Pro Tip:** Note in the booking where clean sets live and where dirty laundry should go. It saves messages on the day.

## How Do You Prevent Stains Between Guests?

Ask guests (politely in the house manual) to use coasters and report spills early. Keep a spare duvet cover for emergencies.

If linen change is part of your Mundoria short-let booking, leave sets ready — we’ll follow the checklist so the next guest walks into a review-ready bed.`,
    cover_url: IMG.bedding,
    excerpt:
      "Should you wash new bedding before use? Here’s what hosts and households should know — plus short-let linen tips.",
    published: true,
    published_at: daysAgo(5),
    slug: "should-you-wash-new-bedding",
    title: "Should you wash new bedding before use?",
  },
  {
    author_name: "Mundoria Team",
    category: "Cleaning Tips",
    content: `End-of-tenancy cleaning isn’t a slightly harder weekly tidy. Landlords and agents look for **inventory-ready** finishes: skirting, inside cupboards, appliance interiors and windowsills that a regular clean might skip.

Use this checklist to brief your Mundoria booking — or to DIY with a clear plan.

## What’s on an End-of-Tenancy Checklist?

### Kitchen
- Cupboards inside and out
- Hob and splashback
- Oven (if required by the inventory)
- Fridge and freezer wipe
- Floors and skirting

### Bathrooms
- Limescale on taps and screens
- Grout wipe
- Extractor cover dusting
- Floors

### Rooms and hallways
- Skirting and windowsills
- Socket surrounds
- Marks on walls where possible within scope
- Final vacuum and mop

## Why Do Photos Help?

Mundoria checklists often include photo confirmation so you can show the agent what was completed. Empty properties photograph cleaner and inventory faster.

| Timing | Advice |
| --- | --- |
| Keys-back date known | Book as soon as you can |
| Same week | Slots go quickly in student corridors |
| Property still full | Empty first — cleans finish sharper |

> **Pro Tip:** Share condition photos in the booking notes. Cleaners can’t fix damaged carpets or broken appliances, but they can prioritise what still matters.

[Book end-of-tenancy cleaning](/booking/new) with your postcode and we’ll show a clear path before you confirm.`,
    cover_url: IMG.empty,
    excerpt:
      "An inventory-ready end-of-tenancy cleaning checklist for Birmingham renters and landlords.",
    published: true,
    published_at: daysAgo(6),
    slug: "end-of-tenancy-cleaning-checklist",
    title: "End of tenancy cleaning checklist",
  },
  {
    author_name: "Daniel K.",
    category: "Home Care",
    content: `Piles of paper and tangled cables on a home desk don’t just look messy — they raise cognitive load. Hybrid workers feel it most: the same corner has to be office and living room.

A short weekly reset can make work-from-home feel calmer without a renovation.

## Why Does Clutter Affect Wellbeing?

Visual noise competes for attention. Clearing one surface completely gives your eye a resting place — and makes it easier to start focused work.

## A 20-Minute Desk Reset

1. Recycle obvious paper
2. Coil cables with simple ties
3. Wipe keyboard, mouse and screen edges
4. Clear one surface completely
5. Empty the waste basket

## Weekly Floor and Bin Pass

Vacuum under the desk and along cable runs. Crumbs and dust collect faster in work-from-home corners than anywhere else.

| Habit | Cadence |
| --- | --- |
| Clear desk to a “done” state | End of each workday |
| Vacuum under desk | Weekly |
| Declutter one drawer | Monthly |

> **Pro Tip:** End each workday by clearing the desk to a known finished state. Tomorrow-you will thank you.

## When Should You Book Help?

If admin piles have spread into living rooms, a Mundoria one-off clean with “office corner priority” in the notes can reset the space while you tackle filing separately.`,
    cover_url: IMG.office,
    excerpt:
      "How home-office clutter affects wellbeing — and a 20-minute reset that actually sticks.",
    published: true,
    published_at: daysAgo(7),
    slug: "office-clutter-and-wellbeing",
    title: "The impact of home-office clutter on wellbeing",
  },
  {
    author_name: "Mundoria Team",
    category: "Host Tips",
    content: `Guest turnovers around Birmingham’s Jewellery Quarter are time-boxed between late checkouts and early arrivals. Consistency beats heroic last-minute scrubs every time.

Here’s how hosts keep a review-ready rhythm — and how Mundoria short-let cleans fit in.

## Why Do Short-Lets Need a Different Rhythm?

Hotels have housekeeping teams on a fixed loop. Short-lets need the same reliability without the overhead: bathroom reset, kitchen wipe, floors, linen, and a quick visual check for the next guest.

## What Do Hosts Usually Need?

- Bathroom and kitchen refresh
- Floor care in living areas
- Linen change when sets are left ready
- Photo confirmation for ops teams

![A review-ready short-let reset is bathroom, kitchen, floors and linen — in that kind of rhythm.](/images/mag/linen-stack.jpg "Leave clean sets labelled so turnovers move faster.")

## How Much Buffer Should You Leave?

Leave enough time between checkout and the next arrival for travel **plus** a full checklist. Rush slots raise the chance of missed details.

| Buffer | Typical use |
| --- | --- |
| Under 2 hours | High risk — only for tiny studios with linen ready |
| 3–4 hours | Comfortable for most city flats |
| Same-day late checkout + early arrival | Book early and keep notes precise |

## House Manual Tips That Help Cleaners

Clear bin instructions, Wi-Fi notes and a short “how to leave the flat” list reduce messy surprises.

> **Pro Tip:** Keep a labelled linen cupboard. Mundoria turnovers move faster when clean sets are obvious.

[Book an Airbnb & Shortlet clean](/booking/new) with lockbox details in the booking — not in a side chat.`,
    cover_url: IMG.shortlet,
    excerpt:
      "Checklist-led guest resets for Birmingham short-lets — linen, bathrooms and a review-ready finish.",
    published: true,
    published_at: daysAgo(8),
    slug: "airbnb-turnovers-jewellery-quarter",
    title: "Airbnb turnovers in the Jewellery Quarter",
  },
  {
    author_name: "Hannah R.",
    category: "Birmingham Life",
    content: `Busy households in Harborne and nearby south-west Birmingham often want the same thing: a home that feels reset without midweek disruption. A Saturday morning clean has become a quiet local ritual.

## What’s the Harborne Pattern?

A fortnightly rhythm — kitchen, bathrooms and floors — keeps family homes manageable between school runs and weekend plans.

## Why Prefer the Same Cleaner?

Once you’re matched on Mundoria, you can ask to keep the same cleaner for recurring visits. Familiarity means less briefing every time: they already know where the vacuum lives and which bathroom gets priority.

## How Do You Secure Weekend Slots?

Weekend slots go quickly around family neighbourhoods. Set your recurring series early and update notes when priorities change — pets, school holidays, guests.

| Cadence | Best for |
| --- | --- |
| Weekly | Busy family homes, pets, lots of cooking |
| Fortnightly | Most flats and smaller terraces |
| Monthly | Light maintenance between deeper seasonal cleans |

> **Pro Tip:** Pair the clean with errands. Live status means you don’t need to wait in.

Enter your postcode, choose regular cleaning, and pick a Saturday window that fits. Mundoria shows a clear estimate before you confirm.`,
    cover_url: IMG.harborne,
    excerpt:
      "How recurring Saturday cleans fit family weekends in south-west Birmingham.",
    published: true,
    published_at: daysAgo(9),
    slug: "saturday-morning-clean-harborne",
    title: "A Saturday morning clean in Harborne",
  },
  {
    author_name: "Mundoria Team",
    category: "Home Care",
    content: `There are seasons when keeping a home tidy simply costs more energy than you have — pregnancy, postpartum, illness, injury or bereavement. Mundoria Recovery is built for those moments.

We’re clear about one thing up front: **Recovery is cleaning with care, not healthcare.**

## What Is Recovery Cleaning?

Practical upkeep — kitchens, bathrooms, floors and surfaces — following your notes and platform checklists, with extra attention to preferences that make the visit kinder.

## What Should You Share in Preferences?

- Priority rooms
- Fragrance-free requests
- Access or mobility notes
- Quiet arrival preferences

## What Are the Boundaries?

Anything clinical stays with your care team. Share only what helps the visit run safely. Cleaners follow your notes; they don’t provide medical support.

| Recovery focus | Example note |
| --- | --- |
| Postpartum | “Kitchen + bathroom priority; please keep fragrance-free.” |
| Illness | “Quiet knock; leave shoes at door.” |
| Bereavement | “Living room and kitchen only today.” |

> **Pro Tip:** You don’t need a long explanation. Short, practical notes are enough.

Choose Recovery when you book, add notes without pressure, and we’ll match with the care those visits need.`,
    cover_url: IMG.recovery,
    excerpt:
      "Supportive cleans for pregnancy, postpartum, illness and bereavement — cleaning with care, not healthcare.",
    published: true,
    published_at: daysAgo(10),
    slug: "what-recovery-cleaning-means",
    title: "What “Recovery” cleaning means at Mundoria",
  },
  {
    author_name: "Lina T.",
    category: "Cleaner Stories",
    content: `People ask what a day on Mundoria actually looks like. Here’s an honest walk-through — from the morning offer feed to checkout and payouts.

## Morning: Choosing the Right Jobs

I open Mundoria, review offers in my areas, and accept what fits travel time. Clear addresses and checklists beat vague cash jobs every time.

## On Site: Checklist First

I check in within the geofence, follow the service checklist, and message the customer only in-app if something unexpected appears. Keeping communication on the platform protects everyone.

## Photos and Checkout

Where the job asks for photos, I upload them before checkout. That helps payment capture after completion and gives customers confidence.

| Step | Why it matters |
| --- | --- |
| Check in | Confirms arrival on site |
| Checklist | Keeps scope clear |
| Photos | Evidence for both sides |
| Check out | Triggers the completion path |

## Payouts

Completed jobs feed my Stripe Express payouts on the schedule I chose. No chasing invoices on Friday nights.

> Mundoria is built so cleaners see clearer work and customers see clearer next steps.

Thinking of joining? Apply as a cleaner, complete onboarding and documents, then wait for approval. The Help Centre has the full partner guide.`,
    cover_url: IMG.cleaner,
    excerpt:
      "From job offer to checklist checkout — how partners actually work a day on Mundoria.",
    published: true,
    published_at: daysAgo(11),
    slug: "day-in-the-life-mundoria-cleaner",
    title: "A day in the life of a Mundoria cleaner",
  },
  {
    author_name: "Mundoria Team",
    category: "Cleaning Tips",
    content: `The difference between a good clean and a great one often isn’t the cleaner — it’s the five minutes of prep before they arrive. A little decluttering means more time spent cleaning, not relocating laundry piles.

## What Should You Do Before the Cleaner Arrives?

1. Clear floors and sofa surfaces
2. Empty the sink and dishwasher if you can
3. Note your top three priorities in the booking
4. Confirm parking, entry codes and rooms in scope
5. Mention pets in special instructions

## Why Does a Priority List Matter?

If time is tight, cleaners need to know what matters most. Bathrooms and kitchen usually top the list — but Recovery preferences or guest bedrooms might come first for you.

| Prep step | Why it helps |
| --- | --- |
| Declutter floors | More vacuum coverage |
| Priority notes | Better use of booked time |
| Fragrance-free flag | Safer for sensitive homes |
| Pet notes | Safer planning for everyone |

> **Pro Tip:** Lockbox codes belong in the booking, not in a text thread.

After the clean, check live status, review photos if included, and keep the same cleaner next time if it went well.`,
    cover_url: IMG.prepare,
    excerpt:
      "Five small steps that help your cleaner finish more of what matters in the time you booked.",
    published: true,
    published_at: daysAgo(12),
    slug: "prepare-your-home-before-a-clean",
    title: "How to prepare your home before a Mundoria clean",
  },
  {
    author_name: "Sofia N.",
    category: "Home Care",
    content: `Strong cleaners can linger in flats with poor ventilation — and they’re tough on pregnancy, asthma and migraine-prone households. Fragrance-free cleaning isn’t a trend; it’s a practical kindness.

## Why Does Fragrance-Free Matter?

Scented products stack. Aerosol fresheners on top of scented sprays don’t remove the source of smells — they add more chemicals to the air.

## What Should You Request on Mundoria?

Add **fragrance-free** in preferences or special instructions. Recovery bookings already nudge towards gentler notes.

## What Can You DIY Between Visits?

- Microfibre and warm water for daily surfaces
- Bicarbonate for gentle deodorising (patch-test first)
- Open windows after cooking instead of masking smells

| Avoid | Prefer |
| --- | --- |
| Heavy aerosol fresheners | Ventilation |
| Layered scented products | Mild, unscented soap |
| Mystery “fresh” sprays | Named ingredients you trust |

> **Pro Tip:** For hosts, listing fragrance-free cleaning in your guest manual is a quiet five-star detail.

Keep homes fresh without heavy scent — especially when someone in the household needs calmer air.`,
    cover_url: IMG.fragrance,
    excerpt:
      "How to keep homes fresh without heavy scent — especially for sensitive households.",
    published: true,
    published_at: daysAgo(13),
    slug: "fragrance-free-cleaning-sensitive-homes",
    title: "Fragrance-free cleaning for sensitive homes",
  },
  {
    author_name: "Mundoria Team",
    category: "Birmingham Life",
    content: `Spilled cooking oil, last-minute guests, a chaotic week — Birmingham same-day cleans are for urgent resets, not your weekly rhythm.

## When Does Same-Day Make Sense?

Use same-day when something unexpected hits and you need a focused visit fast. Don’t use it as a substitute for a fortnightly series if you’re constantly firefighting.

## How Does Mundoria Handle Urgency?

Availability depends on cleaner capacity near your postcode. Enter your postcode first; we only show slots we can try to fulfil.

## What Should You Expect?

A focused visit with clear priorities. Deep oven cleans or full end-of-tenancy standards usually need more planning than same-day allows.

| Same-day works well for | Better booked ahead |
| --- | --- |
| Kitchen + bathroom reset | Oven interiors |
| Pre-guest tidy | Full end of tenancy |
| Spill aftermath | Whole-house deep clean |

> **Pro Tip:** Write three priorities in the notes and unlock access before the cleaner arrives. Same-day works best when they can start immediately.

If you need frequent urgent cleans, a fortnightly series usually costs less stress than repeated same-day bookings.`,
    cover_url: IMG.sameDay,
    excerpt:
      "When a Birmingham same-day clean is worth it — and how to brief it well.",
    published: true,
    published_at: daysAgo(14),
    slug: "same-day-cleans-in-birmingham",
    title: "Same-day cleans in Birmingham: when they help",
  },
  {
    author_name: "Omar F.",
    category: "Cleaning Tips",
    content: `Even “clean” rentals hide cupboard crumbs and bathroom film. A move-in clean before the boxes arrive is one of the highest-ROI hours you’ll spend in a new place.

## Why Clean Before Furniture Arrives?

Empty rooms clean faster and look sharper. Once sofas and wardrobes are in, skirting and corners become a workout.

## Move-In Cleaning Checklist

1. Inside kitchen cupboards and drawers
2. Fridge and freezer wipe
3. Bathroom limescale pass
4. Floors in every room
5. Windowsills and skirting
6. Spot-clean wall marks where possible

## How Should You Sequence With Removals?

Book the clean for the gap between previous tenants leaving and your van arriving. Share key collection notes and photos of problem areas so the checklist matches reality.

| Stage | Action |
| --- | --- |
| Keys available | Book move-in clean |
| During clean | Keep property empty |
| After clean | Move boxes in |

> **Pro Tip:** Choose Mundoria moving-home services and add photos of oven or bathroom issues in the booking notes.

Start the tenancy feeling settled — not scrubbing at midnight with a toothbrush.`,
    cover_url: IMG.moveIn,
    excerpt:
      "A renter’s move-in cleaning checklist — before the boxes hit the floor.",
    published: true,
    published_at: daysAgo(15),
    slug: "move-in-cleaning-checklist-for-renters",
    title: "Move-in cleaning checklist for renters",
  },
  {
    author_name: "Elena V.",
    category: "Host Tips",
    content: `Reviews are won between stays. Guests notice bathrooms, bedding smell and whether the kitchen feels truly reset — not your clever welcome letter alone.

## What Are the Non-Negotiables?

- Spotless bathroom chrome and glass
- Fresh bed presentation
- Empty bins and a stocked roll of bags
- Kitchen surfaces with no sticky residue

## How Do Ops Teams Stay Consistent?

Keep a turnover checklist on the fridge for cleaners and co-hosts. Mundoria short-let jobs already use structured checklists and optional photos.

## What Should You Stock?

Spare toiletries, one spare duvet set, and dishwasher tablets prevent frantic shop runs between guests.

| Review keyword | Fix next turnover |
| --- | --- |
| “Bathroom” | Extra time on chrome and glass |
| “Smell” | Fragrance-free clean + air the flat |
| “Kitchen” | Degrease hob and empty bins |

> **Pro Tip:** Read review keywords monthly. If the same word appears twice, put it at the top of the next booking notes.

Close the loop, keep the checklist boringly consistent, and five-star stays become the default — not a surprise.`,
    cover_url: IMG.fiveStar,
    excerpt:
      "How short-let hosts keep five-star standards between guest stays.",
    published: true,
    published_at: daysAgo(16),
    slug: "hosts-keep-five-star-reviews",
    title: "How hosts keep five-star reviews between guests",
  },
  {
    author_name: "Mundoria Team",
    category: "Company News",
    content: `Welcome to Mundoria Mag — our home for practical cleaning guides, host tips, Birmingham neighbourhood notes and stories from cleaners on the platform.

## Why Did We Start a Magazine?

Booking a cleaner shouldn’t feel like filling in an insurance form, and cleaners shouldn’t chase unpaid cash jobs. The Mag is where we share the know-how that makes home care feel lighter.

## What Will You Find Here?

- Complete cleaning and home-care guides
- Host and short-let tips
- Birmingham life notes
- Cleaner stories from the platform
- Product updates from the team

## Where Are We Launching?

We launch where we can fulfil reliably — central and south-west Birmingham first — then grow outward with the same standard.

> **Pro Tip:** Browse by category above, save the guides you need before a booking, and tell us what to write next via Contact us.

Ready when you are — [book a clean](/booking/new) with a clear estimate before you confirm.`,
    cover_url: IMG.welcome,
    excerpt:
      "Why we built Mundoria Mag — clearer booking, fairer cleaner tools, and cleaning guides that fit real life.",
    published: true,
    published_at: daysAgo(18),
    slug: "welcome-to-mundoria-mag",
    title: "Welcome to Mundoria Mag",
  },
  {
    author_name: "Amira H.",
    category: "Cleaner Stories",
    content: `I didn’t leave cash jobs because I dislike hard work. I left because unclear addresses, last-minute cancellations and awkward payment chats were burning evenings I could have spent resting.

## Why Switch to Mundoria?

Mundoria shows the job scope before I accept. I can see the checklist, the area and the timing — then say yes only when it fits.

## What Do I Look for in an Offer?

Travel time, checklist length, and whether the notes mention pets or parking. Saying yes only when it fits keeps ratings honest.

## Favourite Birmingham Corridors

I cover pockets of Edgbaston and Selly Oak most weeks. Recurring customers mean I already know where the cleaning kit lives.

| Cash jobs | Mundoria |
| --- | --- |
| Vague scope | Checklist before accept |
| Awkward payment chats | Stripe Express payouts |
| Off-platform messages | In-app only |

> **Pro Tip for new partners:** Finish documents early, keep your calendar accurate, and message only in-app. Reliability is the whole product.

If you’re considering the switch, the Help Centre’s “Become a Mundoria cleaner” collection walks through every step.`,
    cover_url: IMG.cash,
    excerpt:
      "A Mundoria cleaner on leaving cash jobs for clearer offers and calmer payouts.",
    published: true,
    published_at: daysAgo(19),
    slug: "why-i-switched-from-cash-jobs",
    title: "Why I switched from cash jobs to Mundoria",
  },
  {
    author_name: "Mundoria Team",
    category: "Birmingham Life",
    content: `A fortnightly clean costs less stress than a panicked deep clean before every birthday party. Birmingham households that settle into a rhythm notice the difference in kitchens first.

## Why Does Recurring Beat Last-Minute Scrambles?

Heroic weekend blitzes feel productive — until you’re exhausted and still hunting for the vacuum. A steady series keeps grease, dust and laundry piles from becoming a crisis.

## How Do You Choose a Cadence?

- **Weekly:** busy family homes, pets, lots of cooking
- **Fortnightly:** most flats and smaller terraces
- **Monthly:** light-touch maintenance between deeper seasonal cleans

## How Do You Keep the Series Alive?

Update notes when you get a puppy, start WFH, or host relatives. Small note changes beat cancelling the series.

| Habit | Result |
| --- | --- |
| Same cleaner preference | Less briefing |
| Updated notes | Better priorities |
| Weekend series booked early | Fewer sold-out slots |

> **Pro Tip:** Book the rhythm once on Mundoria, prefer the same cleaner when matched, and reclaim the Sunday reset for something better.

Set recurring cleaning, keep the notes honest, and let the scrambles become rare.`,
    cover_url: IMG.recurring,
    excerpt:
      "Why a recurring clean usually beats last-minute scrambles in Birmingham homes.",
    published: true,
    published_at: daysAgo(20),
    slug: "recurring-cleans-beat-scrambles",
    title: "Why recurring cleans beat last-minute scrambles",
  },
];
