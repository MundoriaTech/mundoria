/**
 * Seed thousands of users into a hosted or local Supabase project via the
 * service-role API. Prefer `supabase db reset` (uses supabase/seed.sql) for
 * local — this script is for remote projects where SQL seed isn't applied.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 *
 * Demo logins (password SeedPass123!):
 *   admin@seed.mundoria.local
 *   demo.customer@seed.mundoria.local
 *   demo.cleaner@seed.mundoria.local
 *
 * Seed emails are non-routable; sendBrandedEmail skips them so Resend
 * never receives bounces from *@seed.mundoria.local.
 */

import { createClient } from "@supabase/supabase-js";

import {
  BIRMINGHAM_DISTRICTS,
  CLEANER_NAME_OFFSET,
  demoPerson,
  districtForId,
} from "./demo-names.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CUSTOMERS = Number(process.env.SEED_CUSTOMERS ?? 2500);
const CLEANERS = Number(process.env.SEED_CLEANERS ?? 1500);
const BOOKINGS = Number(process.env.SEED_BOOKINGS ?? 4000);
const PASSWORD = "SeedPass123!";
const BATCH = 25;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Prefer the full live catalogue; fall back if older DBs lack some enums.
const SERVICES = [
  "regular",
  "one_off",
  "same_day",
  "deep_clean",
  "end_of_tenancy",
  "move_in",
  "move_out",
  "airbnb_turnover",
  "holiday_let",
  "serviced_accommodation",
  "office",
  "retail_hospitality",
  "educational_facility",
  "communal_area",
  "pregnancy_support",
  "postpartum",
  "hospital_discharge",
  "bereavement_support",
];

/** Prefix "B" matches any Birmingham postcode (B1, B15, B69, …). */
const MATCH_AREA = {
  latitude: 52.4862,
  longitude: -1.8904,
  postcode_prefix: "B",
};

const MATCH_HOURS = { end_time: "23:00", start_time: "06:00" };
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createUser({ email, fullName, gender, role, phone }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: PASSWORD,
    user_metadata: {
      full_name: fullName,
      ...(gender ? { gender } : {}),
      phone,
      role,
    },
  });
  if (!error && data.user) return data.user;

  if (error && !/already|registered|exists/i.test(error.message)) {
    throw error;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id,email")
    .eq("email", email)
    .maybeSingle();
  return profile ? { id: profile.id, email: profile.email } : null;
}

async function ensureDemoUsers() {
  const demos = [
    {
      email: "admin@seed.mundoria.local",
      fullName: "Seed Admin",
      role: "admin",
      phone: "+447700900000",
    },
    {
      email: "demo.customer@seed.mundoria.local",
      fullName: "Sophie Bennett",
      role: "customer",
      phone: "+447700900001",
    },
    {
      email: "demo.cleaner@seed.mundoria.local",
      fullName: "Hannah Adeyemi",
      gender: "woman",
      role: "cleaner",
      phone: "+447711900001",
    },
  ];
  for (const demo of demos) {
    const user = await createUser(demo);
    if (user?.id && demo.role === "admin") {
      const { error } = await admin
        .from("profiles")
        .update({ full_name: demo.fullName, role: "admin" })
        .eq("id", user.id);
      if (error) {
        console.warn("Could not promote seed admin profile:", error.message);
      }
    }
  }
}

async function createBatch(role, count, offset) {
  const ids = [];
  for (let i = 0; i < count; i += 1) {
    const n = offset + i + 1;
    const email = `${role}${String(n).padStart(4, "0")}@seed.mundoria.local`;
    const person = demoPerson(
      role === "cleaner" ? n + CLEANER_NAME_OFFSET : n,
    );
    try {
      const user = await createUser({
        email,
        fullName: person.fullName,
        gender: role === "cleaner" ? person.gender : undefined,
        phone: `+4477${role === "customer" ? "0" : "1"}${String(n).padStart(7, "0")}`.slice(
          0,
          13,
        ),
        role,
      });
      if (user?.id) ids.push(user.id);
    } catch (error) {
      console.warn(`skip ${email}:`, error.message ?? error);
    }
    if ((i + 1) % BATCH === 0) {
      process.stdout.write(
        `\r${role}s: ${offset + i + 1}/${offset + count}   `,
      );
      await sleep(150);
    }
  }
  process.stdout.write("\n");
  return ids;
}

async function activateCleaners(cleanerIds) {
  console.log(`Activating ${cleanerIds.length} cleaners for broad matching…`);
  for (let i = 0; i < cleanerIds.length; i += BATCH) {
    const slice = cleanerIds.slice(i, i + BATCH);
    await makeCleanersMatchReady(slice);
    process.stdout.write(
      `\rmatch-ready cleaners: ${Math.min(i + BATCH, cleanerIds.length)}/${cleanerIds.length}   `,
    );
  }
  process.stdout.write("\n");
  await listDirectoryCleaners(cleanerIds);
}

/** Shortlist seed cleaners for “Your next cleaner…” marketing cards (max 24). */
async function listDirectoryCleaners(cleanerIds) {
  if (!cleanerIds.length) return;
  const DIRECTORY_LISTED = 24;
  await admin
    .from("cleaner_profiles")
    .update({ show_on_directory: false })
    .in("id", cleanerIds);

  const { data: demo } = await admin
    .from("profiles")
    .select("id")
    .eq("email", "demo.cleaner@seed.mundoria.local")
    .maybeSingle();

  // Gender-balance the shortlist (demo names alternate woman/man by index).
  const { data: named } = await admin
    .from("profiles")
    .select("id,email,full_name")
    .in("id", cleanerIds);
  const women = [];
  const men = [];
  for (const profile of named ?? []) {
    const match = profile.email?.match(/^cleaner(\d+)@/i);
    if (match) {
      const person = demoPerson(Number(match[1]) + CLEANER_NAME_OFFSET);
      if (person.gender === "woman") women.push(profile.id);
      else men.push(profile.id);
      continue;
    }
    // Fallback: even demo offset → woman pattern for unknown emails.
    if ((women.length + men.length) % 2 === 0) women.push(profile.id);
    else men.push(profile.id);
  }

  const listed = [];
  if (demo?.id && cleanerIds.includes(demo.id)) listed.push(demo.id);
  const n = Math.max(women.length, men.length);
  for (let i = 0; i < n && listed.length < DIRECTORY_LISTED; i += 1) {
    for (const id of [women[i], men[i]]) {
      if (!id || listed.includes(id)) continue;
      listed.push(id);
      if (listed.length >= DIRECTORY_LISTED) break;
    }
  }
  for (const id of cleanerIds) {
    if (listed.length >= DIRECTORY_LISTED) break;
    if (!listed.includes(id)) listed.push(id);
  }

  const { error } = await admin
    .from("cleaner_profiles")
    .update({ show_on_directory: true })
    .in("id", listed);
  if (error) {
    console.warn(
      "show_on_directory (run migration 20261112150000 if missing):",
      error.message,
    );
    console.warn(
      `Continuing without the column — ${listed.length} seed cleaners stay visible via the current marketing view.`,
    );
    return;
  }
  console.log(
    `Listed ${listed.length} seed cleaners on the public marketing directory`,
  );
}

/** Make cleaners eligible for almost any demo booking (service / day / B* postcode). */
async function makeCleanersMatchReady(cleanerIds) {
  if (!cleanerIds.length) return;

  await admin
    .from("cleaner_profiles")
    .update({
      dbs_verified: true,
      id_verified: true,
      onboarding_complete: true,
      references_verified: true,
      status: "active",
      working_radius_km: 80,
    })
    .in("id", cleanerIds);

  const BIO_TAILS = [
    "Regular and deep cleans with a clear checklist in the app.",
    "Happy with pets, and careful around busy family homes.",
    "Strong on kitchens and bathrooms — detail-led finishes.",
    "Short-let turnovers and guest-ready resets between stays.",
    "Move-out and end-of-tenancy cleans for agent handovers.",
    "Quiet, punctual visits that fit around your working day.",
  ];
  await Promise.all(
    cleanerIds.map((cleaner_id, index) => {
      const district = districtForId(cleaner_id);
      const miles = 6 + (index % 10);
      // Modest baseline — seedRatings() raises jobs only when reviews exist.
      const jobs = 1 + (index % 3);
      const years = 1 + (index % 9);
      return admin
        .from("cleaner_profiles")
        .update({
          bio: `Independent cleaner covering ${district.area} and nearby. ${BIO_TAILS[index % BIO_TAILS.length]} Travels up to about ${miles} miles.`,
          rating: 0,
          total_jobs: jobs,
          years_experience: years,
          working_radius_km: Math.round(miles * 1.609),
        })
        .eq("id", cleaner_id);
    }),
  );

  // Every service row exists; diversifyDirectoryServices() turns most off per cleaner.
  for (const service_type of SERVICES) {
    const services = cleanerIds.map((cleaner_id) => ({
      cleaner_id,
      is_active: true,
      service_type,
    }));
    const { error } = await admin.from("cleaner_services").upsert(services, {
      onConflict: "cleaner_id,service_type",
      ignoreDuplicates: true,
    });
    if (error) {
      console.warn(`service ${service_type}:`, error.message);
    }
  }
  await diversifyDirectoryServices(cleanerIds);

  // Replace areas with a single Birmingham-wide prefix so any B* postcode matches.
  await admin.from("cleaner_working_areas").delete().in("cleaner_id", cleanerIds);
  await admin.from("cleaner_working_areas").insert(
    cleanerIds.flatMap((cleaner_id) => {
      const district = districtForId(cleaner_id);
      return [
        { cleaner_id, ...MATCH_AREA },
        {
          cleaner_id,
          latitude: 52.47,
          longitude: -1.89,
          postcode_prefix: district.prefix,
        },
      ];
    }),
  );

  // One wide slot every day covers morning / afternoon / evening bookings.
  await admin.from("cleaner_availability").delete().in("cleaner_id", cleanerIds);
  const availability = cleanerIds.flatMap((cleaner_id) =>
    [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({
      cleaner_id,
      day_of_week,
      end_time: MATCH_HOURS.end_time,
      is_available: true,
      start_time: MATCH_HOURS.start_time,
    })),
  );
  const { error: availabilityError } = await admin
    .from("cleaner_availability")
    .insert(availability);
  if (availabilityError) {
    console.warn("availability:", availabilityError.message);
  }
}

/** Free match-ready cleaners from future seed jobs so demo bookings are not blocked. */
async function freeCleanersForNewMatches(cleanerIds) {
  if (!cleanerIds.length) return;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < cleanerIds.length; i += BATCH) {
    const slice = cleanerIds.slice(i, i + BATCH);
    await admin
      .from("bookings")
      .update({ cleaner_id: null, status: "pending_match" })
      .in("cleaner_id", slice)
      .gte("scheduled_date", today)
      .not("status", "in", '("completed","cancelled","in_progress")');
  }
  console.log(
    `Cleared future assignments on ${cleanerIds.length} seed cleaners so they can match new demo bookings.`,
  );
}

async function seedAddresses(customerIds) {
  console.log(`Ensuring addresses for ${customerIds.length} customers…`);
  let created = 0;
  let skipped = 0;
  for (let i = 0; i < customerIds.length; i += BATCH) {
    const slice = customerIds.slice(i, i + BATCH);
    const { data: existing } = await admin
      .from("addresses")
      .select("customer_id")
      .in("customer_id", slice)
      .eq("is_default", true);
    const have = new Set((existing ?? []).map((row) => row.customer_id));
    const missing = slice.filter((id) => !have.has(id));
    skipped += slice.length - missing.length;
    if (missing.length) {
      const rows = missing.map((customerId, idx) => {
        const n = i + idx;
        return {
          address_line_1: `${10 + (n % 200)} Seed Street`,
          city: "Birmingham",
          customer_id: customerId,
          is_default: true,
          label: "Home",
          latitude: 52.47 + (n % 80) / 1000,
          longitude: -1.92 - (n % 80) / 1000,
          num_bathrooms: 1 + (n % 2),
          num_bedrooms: 1 + (n % 4),
          postcode: `B${1 + (n % 15)} ${1 + (n % 9)}AA`,
          property_type:
            n % 5 === 0 ? "office" : n % 2 === 0 ? "flat" : "house",
        };
      });
      const { error } = await admin.from("addresses").insert(rows);
      if (error) {
        console.warn(`address batch error @${i}:`, error.message);
      } else {
        created += rows.length;
      }
    }
    process.stdout.write(
      `\raddresses: ${Math.min(i + BATCH, customerIds.length)}/${customerIds.length}   `,
    );
  }
  process.stdout.write(
    `\naddresses created: ${created}, already present: ${skipped}\n`,
  );
}

async function loadSeedAddresses(customerIds) {
  const addresses = [];
  for (let i = 0; i < customerIds.length; i += 100) {
    const chunk = customerIds.slice(i, i + 100);
    const { data, error } = await admin
      .from("addresses")
      .select("id,customer_id")
      .in("customer_id", chunk)
      .eq("is_default", true);
    if (error) {
      console.warn(`address load error @${i}:`, error.message);
      continue;
    }
    if (data?.length) addresses.push(...data);
  }
  return addresses;
}

async function loadSeedProfileIds(role) {
  const ids = [];
  let from = 0;
  const pageSize = 1000;
  for (;;) {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("role", role)
      .like("email", "%@seed.mundoria.local")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    ids.push(...data.map((row) => row.id));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return ids;
}

async function seedBookings(customerIds, cleanerIds) {
  console.log(`Creating ~${BOOKINGS} bookings…`);
  console.log("service types:", SERVICES.join(", "));
  const addresses = await loadSeedAddresses(customerIds);
  if (!addresses?.length) {
    console.warn("No addresses found — skip bookings");
    return;
  }
  console.log(`Using ${addresses.length} addresses for bookings`);

  const rows = [];
  for (let i = 0; i < BOOKINGS; i += 1) {
    const address = addresses[i % addresses.length];
    const scheduledDate = new Date(Date.now() + ((i % 60) - 20) * 86400000)
      .toISOString()
      .slice(0, 10);
    const scheduledTime = ["09:00", "10:00", "11:00", "14:00", "16:00"][i % 5];
    const startsAt = new Date(`${scheduledDate}T${scheduledTime}:00`).getTime();
    const upcoming = startsAt > Date.now();
    const status = upcoming
      ? ["pending_match", "matched", "confirmed"][i % 3]
      : ["completed", "cancelled", "awaiting_customer_confirmation", "in_progress"][
          i % 4
        ];
    const total = 4500 + (i % 40) * 250;
    const cleaner = Math.floor(total * 0.8);
    rows.push({
      actual_start_time:
        status === "in_progress" ? new Date(startsAt).toISOString() : null,
      address_id: address.id,
      amount_cleaner: cleaner,
      amount_platform: total - cleaner,
      amount_total: total,
      checkin_verified: status === "in_progress",
      cleaner_id:
        status === "pending_match"
          ? null
          : cleanerIds[i % cleanerIds.length] ?? null,
      customer_id: address.customer_id,
      estimated_duration_hours: 2 + (i % 4),
      is_recurring: false,
      payment_status:
        status === "completed" || status === "awaiting_customer_confirmation"
          ? "released"
          : status === "cancelled"
            ? "refunded"
            : "held",
      scheduled_date: scheduledDate,
      scheduled_start_time: scheduledTime,
      service_type: SERVICES[i % SERVICES.length],
      special_instructions: `Seed booking #${i + 1}`,
      status,
    });
    if (rows.length >= 150) {
      const { error } = await admin
        .from("bookings")
        .insert(rows.splice(0, rows.length));
      if (error) console.warn("booking batch error:", error.message);
      process.stdout.write(`\rbookings: ${i + 1}/${BOOKINGS}   `);
      await sleep(50);
    }
  }
  if (rows.length) {
    const { error } = await admin.from("bookings").insert(rows);
    if (error) console.warn("booking final error:", error.message);
  }
  process.stdout.write("\n");
}

/** Service-aware review copy — large pools so the same cleaner never repeats lines. */
const RATING_COMMENTS_BY_SERVICE = {
  regular: [
    "Quiet fortnightly visit while I worked from home. Checklist followed exactly.",
    "Same cleaner each week now. Bathrooms and kitchen always properly finished.",
    "Punctual, careful with pets, and the place feels lighter every time.",
    "We keep the Friday slot. Communication in the app stays clear and calm.",
    "Regular cleans that actually stick to the notes. No skipped corners.",
    "Reliable weekly rhythm. Floors and bathrooms look finished, not rushed.",
  ],
  one_off: [
    "Booked a one-off before guests arrived. Done on time with clear updates.",
    "One-off reset after a busy month. Cupboards and floors properly sorted.",
    "Needed a single deep tidy before a viewing. Left the place photo-ready.",
    "One-off booking around a work trip. Keys returned and house felt new.",
    "Booked once for spring. Oven and fridge extras were done properly.",
  ],
  same_day: [
    "Needed same-day help and they fitted us in. Arrived when the app said.",
    "Same-day booking after a spill. Quick match and a thorough finish.",
    "Last-minute clean before family arrived. Status updates kept us calm.",
    "Same-day slot after a party. Kitchen and living room sorted by evening.",
  ],
  deep_clean: [
    "Deep clean took the sticky film off the kitchen cupboards we'd ignored for months.",
    "Full deep clean before moving furniture back in. Oven and skirting done properly.",
    "Booked a deep clean after builders left. Dust gone from every sill.",
    "Deep clean for a tired flat. Tiles, grout and extractor actually look reset.",
    "Long deep-clean session. Checklist matched what we paid for, room by room.",
    "Finally got behind the appliances. Worth every minute of the deep clean.",
  ],
  end_of_tenancy: [
    "End-of-tenancy photos made the agent handover much easier than last time.",
    "Inventory checklist was followed room by room. Deposit claim went smoothly.",
    "Agent signed off the same day. Cupboards and oven were spotless.",
    "Move-out inventory clean. Marks on walls and skirting actually addressed.",
    "End of tenancy without the usual panic. Clear notes and clear photos.",
  ],
  move_in: [
    "Move-in clean before the keys. Empty property ready the same afternoon.",
    "New flat smelled fresh and looked finished before we unloaded the van.",
    "Move-in wipe-through after the previous tenants. Cupboards empty and clean.",
    "First night in the new place felt calm thanks to the move-in clean.",
  ],
  move_out: [
    "Move-out clean left it ready for the next tenants the same day.",
    "Cleared the last of the packing dust. Landlord signed off without fuss.",
    "Move-out after years in the house. Oven and bathrooms passed first check.",
    "Empty property handover clean. No second visit needed.",
  ],
  airbnb_turnover: [
    "Turnover between guests used to be a panic. Status trail kept me calm.",
    "Guest-ready reset with linen notes followed. Next check-in was easy.",
    "Tight Airbnb window between bookings. Beds, bathrooms and kitchen done.",
    "Turnover cleaner messaged before entry and left it guest-ready.",
    "Short-stay reset with the exact checklist we use for 5-star stays.",
  ],
  holiday_let: [
    "Holiday-let changeover done before the next family arrived. Checklist clear.",
    "Quick holiday let reset. Bathrooms and kitchen guest-ready.",
    "Changeover between summer bookings. Towels and surfaces properly finished.",
    "Holiday cottage reset after a muddy weekend. Floors and porch sorted.",
  ],
  serviced_accommodation: [
    "Serviced apartment turnaround between corporate stays. Desks and kitchen sorted.",
    "Reliable reset for our serviced unit. Notes about the coffee machine were followed.",
    "Corporate let turnover. Meeting table and kitchenette left presentation-ready.",
    "Serviced flat clean between guests. Quiet, punctual, checklist complete.",
  ],
  office: [
    "Office wipe-down between meetings. Desks clear, bins emptied, no drama.",
    "Weekly office clean keeps the meeting room presentable for clients.",
    "After-hours office clean. Keypad entry worked and the kitchen was reset.",
    "Small studio office cleaned overnight. Desks and glass looked ready for Monday.",
  ],
  retail_hospitality: [
    "Shop floor and back-of-house wiped down before opening. Quiet and efficient.",
    "Café close-down clean. Counters and floors ready for the morning shift.",
    "Retail fit-out dust cleared before we opened. Shelves and glass done properly.",
    "Hospitality close clean. Grease on the pass was finally gone.",
  ],
  educational_facility: [
    "Classroom and corridor clean after term events. Careful around kit.",
    "Nursery wipe-down to the brief. Staff could reopen on schedule.",
    "After a school fair the hall was reset overnight. Floors and tables ready.",
    "Training room clean between cohorts. Boards and desks left tidy.",
  ],
  communal_area: [
    "Communal hallway and bin store left tidy for the block. Regular and reliable.",
    "Shared lobby clean. Fingerprints off glass, floors properly done.",
    "Stairwell and landing clean for our block. Quiet early-morning visit.",
    "Communal laundry and corridor reset. Residents noticed the difference.",
  ],
  pregnancy_support: [
    "Gentle clean while I was late in pregnancy. Quiet, careful, no strong smells.",
    "Pregnancy support visit. Took the pressure off without rushing me.",
    "Booked pregnancy help for the bathrooms and kitchen. Soft products as asked.",
    "Late-pregnancy clean. Moved carefully around the house and stuck to the notes.",
  ],
  postpartum: [
    "Postpartum help with kitchen and bathrooms. Kind and unobtrusive.",
    "Came after the baby arrived. Focused on what we asked and left us resting.",
    "Postpartum reset of the main rooms. Calm visit while the baby slept.",
    "Early weeks support clean. No fuss, just the rooms that needed it most.",
  ],
  hospital_discharge: [
    "Home reset after hospital discharge. Soft products as requested.",
    "Discharge clean meant we could come home to a calm, tidy space.",
    "After a hospital stay the bedroom and bathroom were ready for rest.",
    "Discharge support clean. Quiet, careful, and finished before we arrived home.",
  ],
  bereavement_support: [
    "Handled a difficult clear with care and patience. Grateful for the calm approach.",
    "Bereavement support clean. Respectful, thorough, no unnecessary chatter.",
    "Sensitive clear of a relative's flat. Treated everything with care.",
    "Bereavement clean that gave the family space to breathe. Thank you.",
  ],
};

const RATING_COMMENTS_FALLBACK = [
  "Punctual, careful and professional. The whole flow felt calm instead of transactional.",
  "Clear updates throughout, and the checklist matched what we asked for.",
  "We asked for the same cleaner again and the preference stuck.",
  "Arrived on time, messaged before entry, and finished exactly to the booking notes.",
  "Left the place lighter without hovering. Would book again.",
  "Special-attention notes were actually followed. No skipped extras.",
];

/**
 * Per-cleaner whole-star pools so a 4.5 card is a mix of 4★ and 5★ reviews
 * (not every row showing five filled stars). Averages roughly 4.1 → 4.9.
 * Keep room_ratings empty — the ratings trigger overwrites overall_score from
 * room averages, which previously forced every review to 4.5.
 */
const RATING_SCORE_BANDS = [
  [3, 4, 4, 5, 4, 4, 5], // ~4.1
  [4, 4, 5, 4, 3, 5, 4], // ~4.1
  [4, 4, 5, 4, 5, 4, 4], // ~4.3
  [4, 5, 4, 5, 4, 4, 5], // ~4.4
  [4, 5, 5, 4, 5, 4, 5], // ~4.6
  [5, 4, 5, 5, 4, 5, 5], // ~4.7
  [5, 5, 4, 5, 5, 5, 4], // ~4.7
  [5, 5, 5, 4, 5, 5, 5], // ~4.9
];

function scoreBandForCleaner(cleanerId, index) {
  // Spread bands by index so neighbours on the directory don't share one average.
  const band = (index * 3 + cleanerId.charCodeAt(0)) % RATING_SCORE_BANDS.length;
  return RATING_SCORE_BANDS[band];
}

function scoreForReview(cleanerId, index, reviewOrdinal) {
  const band = scoreBandForCleaner(cleanerId, index);
  return band[reviewOrdinal % band.length];
}

const SERVICE_FOCUS = {
  residential: ["regular", "one_off", "deep_clean", "end_of_tenancy", "move_in", "move_out", "same_day"],
  short_let: ["airbnb_turnover", "holiday_let", "serviced_accommodation", "regular", "one_off", "deep_clean"],
  commercial: ["office", "retail_hospitality", "communal_area", "educational_facility", "regular", "one_off"],
  recovery: ["pregnancy_support", "postpartum", "hospital_discharge", "bereavement_support", "regular", "deep_clean"],
};

/** Realistic active-service mix so cards and reviews match what each cleaner offers. */
function serviceSetForCleaner(index) {
  const focuses = ["residential", "short_let", "residential", "commercial", "residential", "recovery"];
  const focus = SERVICE_FOCUS[focuses[index % focuses.length]];
  // Keep a small shared core so most residential pages still show someone useful.
  const core = ["regular", "one_off", "deep_clean"];
  return Array.from(new Set([...core, ...focus]));
}

/** Varied publishable review targets — not every cleaner stuck on 2. */
function reviewTargetForCleaner(index) {
  const band = index % 10;
  if (band === 0) return 0; // New
  if (band === 1) return 1 + (index % 2); // 1–2
  if (band === 2 || band === 3) return 4 + (index % 4); // 4–7
  if (band === 4 || band === 5 || band === 6) return 9 + (index % 8); // 9–16
  return 18 + (index % 15); // 18–32 established
}

async function diversifyDirectoryServices(cleanerIds) {
  if (!cleanerIds.length) return;
  const { data: demo } = await admin
    .from("profiles")
    .select("id")
    .eq("email", "demo.cleaner@seed.mundoria.local")
    .maybeSingle();
  const demoId = demo?.id;

  for (let index = 0; index < cleanerIds.length; index += 1) {
    const cleaner_id = cleanerIds[index];
    if (cleaner_id === demoId) continue; // demo stays match-ready for any service
    const active = new Set(serviceSetForCleaner(index));
    await admin
      .from("cleaner_services")
      .update({ is_active: false })
      .eq("cleaner_id", cleaner_id);
    await admin
      .from("cleaner_services")
      .update({ is_active: true })
      .eq("cleaner_id", cleaner_id)
      .in("service_type", [...active]);
  }
  console.log(`Diversified active services for ${cleanerIds.length} seed cleaners`);
}

function commentPoolForService(serviceType) {
  return [
    ...(RATING_COMMENTS_BY_SERVICE[serviceType] ?? []),
    ...RATING_COMMENTS_FALLBACK,
  ];
}

/** Pick a comment not already used for this cleaner when possible. */
function uniqueCommentFor(serviceType, ordinal, used) {
  const pool = commentPoolForService(serviceType);
  for (let i = 0; i < pool.length; i += 1) {
    const comment = pool[(ordinal + i) % pool.length];
    if (!used.has(comment)) {
      used.add(comment);
      return comment;
    }
  }
  // Exhausted service pool — fall back to any unused global line.
  for (const comment of RATING_COMMENTS_FALLBACK) {
    if (!used.has(comment)) {
      used.add(comment);
      return comment;
    }
  }
  const fallback = pool[ordinal % pool.length] ?? RATING_COMMENTS_FALLBACK[0];
  used.add(`${fallback} · ${ordinal + 1}`);
  return `${fallback} Still just as careful on this visit.`;
}

/** Ensure customer has an address in this district; create one if needed. */
async function addressInDistrict(customerId, district, salt) {
  const { data: existing } = await admin
    .from("addresses")
    .select("id, customer_id, postcode")
    .eq("customer_id", customerId)
    .ilike("postcode", `${district.prefix}%`)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing;

  const postcode = `${district.prefix} ${1 + (salt % 9)}${String.fromCharCode(65 + (salt % 26))}${String.fromCharCode(65 + ((salt * 3) % 26))}`;
  const { data: created, error } = await admin
    .from("addresses")
    .insert({
      address_line_1: `${10 + (salt % 180)} ${district.area} Road`,
      city: "Birmingham",
      customer_id: customerId,
      is_default: false,
      label: district.area,
      latitude: 52.45 + (salt % 40) * 0.002,
      longitude: -1.9 - (salt % 40) * 0.002,
      num_bathrooms: 1 + (salt % 2),
      num_bedrooms: 1 + (salt % 3),
      postcode,
      property_type: salt % 3 === 0 ? "flat" : "house",
    })
    .select("id, customer_id, postcode")
    .maybeSingle();
  if (error) {
    console.warn(`address ${district.prefix}/${customerId.slice(0, 8)}:`, error.message);
    return null;
  }
  return created;
}

/**
 * Create past completed bookings in each cleaner's district, on services they
 * actually offer, with a varied count so directory cards don't all show “2 reviews”.
 * Each booking uses a different customer so profile reviews don't all say “Fatima”.
 */
async function ensureCompletedBookingsForDirectory(cleanerIds) {
  if (!cleanerIds.length) return;
  const customerIds = await loadSeedProfileIds("customer");
  if (!customerIds.length) {
    console.warn("No seed customers — cannot backfill directory reviews");
    return;
  }

  const { data: serviceRows } = await admin
    .from("cleaner_services")
    .select("cleaner_id, service_type")
    .in("cleaner_id", cleanerIds)
    .eq("is_active", true);
  const servicesByCleaner = new Map();
  for (const row of serviceRows ?? []) {
    const list = servicesByCleaner.get(row.cleaner_id) ?? [];
    list.push(row.service_type);
    servicesByCleaner.set(row.cleaner_id, list);
  }

  // Replace prior directory-review bookings so customers/comments can be rebuilt cleanly.
  {
    const { data: oldDir } = await admin
      .from("bookings")
      .select("id")
      .in("cleaner_id", cleanerIds)
      .ilike("special_instructions", "%directory review%")
      .limit(3000);
    const oldIds = (oldDir ?? []).map((row) => row.id);
    if (oldIds.length) {
      // Ratings cascade / manual wipe happens in seedRatings; bookings first.
      for (let i = 0; i < oldIds.length; i += 100) {
        const slice = oldIds.slice(i, i + 100);
        await admin.from("ratings").delete().in("booking_id", slice);
        await admin.from("bookings").delete().in("id", slice);
      }
      console.log(`Removed ${oldIds.length} prior directory-review bookings`);
    }
  }

  const rows = [];
  for (let index = 0; index < cleanerIds.length; index += 1) {
    const cleaner_id = cleanerIds[index];
    const need = reviewTargetForCleaner(index);
    if (!need) continue;
    const district = districtForId(cleaner_id);
    const offered =
      servicesByCleaner.get(cleaner_id)?.length
        ? servicesByCleaner.get(cleaner_id)
        : serviceSetForCleaner(index);

    // Rotate customers so one cleaner never gets the same reviewer repeatedly.
    const usedCustomers = new Set();
    for (let n = 0; n < need; n += 1) {
      let customer_id = null;
      for (let attempt = 0; attempt < customerIds.length; attempt += 1) {
        const candidate =
          customerIds[(index * 19 + n * 7 + attempt * 3) % customerIds.length];
        if (!usedCustomers.has(candidate)) {
          customer_id = candidate;
          break;
        }
      }
      customer_id =
        customer_id ?? customerIds[(index + n) % customerIds.length];
      usedCustomers.add(customer_id);

      const address = await addressInDistrict(
        customer_id,
        district,
        index * 50 + n,
      );
      if (!address) continue;

      const daysAgo = 10 + ((index * 7 + n * 5) % 150);
      const scheduledDate = new Date(Date.now() - daysAgo * 86400000)
        .toISOString()
        .slice(0, 10);
      const total = 4800 + ((index * 3 + n) % 16) * 250;
      const service_type = offered[(index + n) % offered.length];
      rows.push({
        address_id: address.id,
        amount_cleaner: Math.floor(total * 0.8),
        amount_platform: total - Math.floor(total * 0.8),
        amount_total: total,
        checkin_verified: true,
        cleaner_id,
        customer_id: address.customer_id,
        estimated_duration_hours: 2 + ((index + n) % 4),
        is_recurring: false,
        payment_status: "released",
        scheduled_date: scheduledDate,
        scheduled_start_time: ["09:00", "10:30", "11:00", "14:00", "16:00"][
          (index + n) % 5
        ],
        service_type,
        special_instructions: `${district.area} · ${service_type} · directory review ${n + 1}`,
        status: "completed",
      });
    }
  }

  if (!rows.length) {
    console.log("Directory bookings already cover review targets");
    return;
  }
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 80) {
    const chunk = rows.slice(i, i + 80);
    const { error } = await admin.from("bookings").insert(chunk);
    if (error) console.warn("directory booking backfill:", error.message);
    else inserted += chunk.length;
  }
  console.log(
    `Backfilled ${inserted} completed bookings for directory reviews (unique customers + district/services)`,
  );
}

async function seedRatings() {
  let listed = [];
  const listedQuery = await admin
    .from("cleaner_profiles")
    .select("id")
    .eq("show_on_directory", true);
  if (!listedQuery.error && listedQuery.data?.length) {
    listed = listedQuery.data.map((row) => row.id);
  } else {
    listed = (await loadSeedProfileIds("cleaner")).slice(0, 32);
  }
  const listedSet = new Set(listed);
  const directoryCleaners = listed.slice(0, 32);

  await diversifyDirectoryServices(directoryCleaners);
  await ensureCompletedBookingsForDirectory(directoryCleaners);

  const targets = new Map(
    directoryCleaners.map((id, index) => [id, reviewTargetForCleaner(index)]),
  );

  // Drop prior seed ratings for these cleaners so counts/services stay coherent.
  {
    const { error: wipeError } = await admin
      .from("ratings")
      .delete()
      .in("cleaner_id", directoryCleaners);
    if (wipeError) {
      console.warn("ratings wipe:", wipeError.message);
    } else {
      console.log(`Cleared prior ratings for ${directoryCleaners.length} directory cleaners`);
    }
  }

  const { data: serviceRows } = await admin
    .from("cleaner_services")
    .select("cleaner_id, service_type")
    .in("cleaner_id", directoryCleaners)
    .eq("is_active", true);
  const servicesByCleaner = new Map();
  for (const row of serviceRows ?? []) {
    const set = servicesByCleaner.get(row.cleaner_id) ?? new Set();
    set.add(row.service_type);
    servicesByCleaner.set(row.cleaner_id, set);
  }

  const { data: bookings, error } = await admin
    .from("bookings")
    .select("id,customer_id,cleaner_id,service_type,scheduled_date,scheduled_start_time")
    .eq("status", "completed")
    .in("cleaner_id", directoryCleaners)
    .ilike("special_instructions", "%directory review%")
    .order("scheduled_date", { ascending: false })
    .limit(2000);
  if (error) {
    console.warn("ratings load error:", error.message);
    return;
  }
  if (!bookings?.length) {
    console.log("No completed bookings — skip ratings");
    return;
  }

  const byCleaner = new Map();
  for (const booking of bookings) {
    const offered = servicesByCleaner.get(booking.cleaner_id);
    // Only publish reviews for services the cleaner still offers.
    if (offered && !offered.has(booking.service_type)) continue;
    const list = byCleaner.get(booking.cleaner_id) ?? [];
    list.push(booking);
    byCleaner.set(booking.cleaner_id, list);
  }

  const cleanerIndex = new Map(
    directoryCleaners.map((id, index) => [id, index]),
  );
  const picked = [];
  for (const cleanerId of directoryCleaners) {
    const target = targets.get(cleanerId) ?? 0;
    const list = byCleaner.get(cleanerId) ?? [];
    // Prefer distinct customers first so profile pages aren't one person repeating.
    const uniqueCustomer = [];
    const seenCustomers = new Set();
    const rest = [];
    for (const booking of list) {
      if (seenCustomers.has(booking.customer_id)) rest.push(booking);
      else {
        seenCustomers.add(booking.customer_id);
        uniqueCustomer.push(booking);
      }
    }
    const ordered = [...uniqueCustomer, ...rest];
    for (let i = 0; i < Math.min(target, ordered.length); i += 1) {
      picked.push({ booking: ordered[i], ordinal: i });
    }
  }

  const usedCommentsByCleaner = new Map();
  const rows = picked.map(({ booking, ordinal }) => {
    const index = cleanerIndex.get(booking.cleaner_id) ?? 0;
    const used =
      usedCommentsByCleaner.get(booking.cleaner_id) ?? new Set();
    usedCommentsByCleaner.set(booking.cleaner_id, used);
    return {
      application_status: "applied",
      booking_id: booking.id,
      cleaner_id: booking.cleaner_id,
      comment: uniqueCommentFor(booking.service_type, ordinal, used),
      customer_id: booking.customer_id,
      overall_score: scoreForReview(booking.cleaner_id, index, ordinal),
      // Empty so calculate_rating_score() leaves overall_score alone.
      room_ratings: {},
    };
  });

  // Upsert in chunks
  for (let i = 0; i < rows.length; i += 80) {
    const chunk = rows.slice(i, i + 80);
    const { error: insertError } = await admin.from("ratings").upsert(chunk, {
      onConflict: "booking_id",
      ignoreDuplicates: false,
    });
    if (insertError) {
      console.warn("ratings seed error:", insertError.message);
      return;
    }
  }

  // Stagger created_at from booking dates so every review isn't “5 minutes ago”.
  const bookingById = new Map((bookings ?? []).map((row) => [row.id, row]));
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const booking = bookingById.get(row.booking_id);
    if (!booking?.scheduled_date) continue;
    // Postgres time may be "09:00:00" — only use HH:MM for the ISO stamp.
    const time = String(booking.scheduled_start_time || "14:00").slice(0, 5);
    const created = new Date(`${booking.scheduled_date}T${time}:00.000Z`);
    created.setUTCHours(created.getUTCHours() + 3 + (i % 5));
    if (Number.isNaN(created.getTime())) continue;
    await admin
      .from("ratings")
      .update({ created_at: created.toISOString() })
      .eq("booking_id", row.booking_id);
  }

  const reviewedIds = new Set(rows.map((row) => row.cleaner_id));

  for (const cleanerId of directoryCleaners) {
    const scores = rows
      .filter((row) => row.cleaner_id === cleanerId)
      .map((row) => row.overall_score);
    if (!scores.length) {
      await admin
        .from("cleaner_profiles")
        .update({ rating: 0, total_jobs: 1 + (cleanerId.charCodeAt(0) % 3) })
        .eq("id", cleanerId);
      continue;
    }
    const reviewCount = scores.length;
    const avg =
      Math.round(
        (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10,
      ) / 10;
    // Jobs always exceed reviews; established cleaners look busier.
    const jobs =
      reviewCount * (4 + (cleanerId.charCodeAt(1) % 4)) +
      6 +
      (cleanerId.charCodeAt(0) % 11);
    await admin
      .from("cleaner_profiles")
      .update({ rating: avg, total_jobs: jobs })
      .eq("id", cleanerId);
  }

  const unreviewed = [...listedSet].filter((id) => !reviewedIds.has(id));
  if (unreviewed.length) {
    await admin
      .from("cleaner_profiles")
      .update({ rating: 0 })
      .in("id", unreviewed);
  }

  console.log(
    `Seeded ${rows.length} ratings across ${reviewedIds.size} cleaners (varied counts, services + districts)`,
  );
}

/** Rename existing seed profiles so surnames are mixed (fixes Farooq batches). */
async function refreshSeedNames() {
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id,email,role")
    .like("email", "%@seed.mundoria.local")
    .in("role", ["cleaner", "customer"]);
  if (error) {
    console.warn("refresh names:", error.message);
    return;
  }
  let updated = 0;
  for (const profile of profiles ?? []) {
    const match = profile.email.match(/^(cleaner|customer)(\d+)@/i);
    if (!match) continue;
    const n = Number(match[2]);
    const person = demoPerson(
      match[1].toLowerCase() === "cleaner" ? n + CLEANER_NAME_OFFSET : n,
    );
    const { error: updateError } = await admin
      .from("profiles")
      .update({ full_name: person.fullName })
      .eq("id", profile.id);
    if (!updateError) updated += 1;
  }
  console.log(`Refreshed ${updated} seed display names`);
}

async function main() {
  const mode = process.env.SEED_MODE ?? "full";
  console.log(
    `Seeding Mundoria → ${url}\n` +
      `mode=${mode} customers=${CUSTOMERS} cleaners=${CLEANERS} bookings=${BOOKINGS}`,
  );

  // Always ensure demo admin/customer/cleaner exist (incl. backfill/bookings modes).
  await ensureDemoUsers();

  if (mode === "match-ready") {
    const cleanerIds = await loadSeedProfileIds("cleaner");
    console.log(`Boosting ${cleanerIds.length} seed cleaners for guaranteed matching…`);
    await activateCleaners(cleanerIds);
    await freeCleanersForNewMatches(cleanerIds);
    console.log("\nDone. Demo bookings with any B* postcode / service / daytime slot should match.");
    console.log("Demo customer: demo.customer@seed.mundoria.local / SeedPass123!");
    console.log("Demo cleaner:  demo.cleaner@seed.mundoria.local / SeedPass123!");
    return;
  }

  if (mode === "refresh-directory") {
    const cleanerIds = await loadSeedProfileIds("cleaner");
    console.log(`Refreshing directory seed for ${cleanerIds.length} cleaners…`);
    await refreshSeedNames();
    await activateCleaners(cleanerIds);
    await seedRatings();
    await freeCleanersForNewMatches(cleanerIds);
    console.log("\nDone. Names, bios, jobs, ratings and reviews refreshed.");
    return;
  }

  let customerIds = [];
  let cleanerIds = [];

  if (mode === "backfill" || mode === "bookings") {
    customerIds = await loadSeedProfileIds("customer");
    cleanerIds = await loadSeedProfileIds("cleaner");
    console.log(
      `Backfill from existing seed profiles: ${customerIds.length} customers, ${cleanerIds.length} cleaners`,
    );
    await activateCleaners(cleanerIds);
    await freeCleanersForNewMatches(cleanerIds);
  } else {
    customerIds = await createBatch("customer", CUSTOMERS, 0);
    cleanerIds = await createBatch("cleaner", CLEANERS, 0);
    await activateCleaners(cleanerIds);
  }

  if (mode !== "bookings") {
    await seedAddresses(customerIds);
  }
  await seedBookings(customerIds, cleanerIds);
  await seedRatings();

  // After seeding historical bookings, free cleaners again for live demo matching.
  await freeCleanersForNewMatches(cleanerIds);

  console.log("\nDone.");
  console.log("Demo admin:    admin@seed.mundoria.local / SeedPass123!");
  console.log("Demo customer: demo.customer@seed.mundoria.local / SeedPass123!");
  console.log("Demo cleaner:  demo.cleaner@seed.mundoria.local / SeedPass123!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
