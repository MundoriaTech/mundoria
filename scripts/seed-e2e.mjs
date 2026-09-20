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
 */

import { createClient } from "@supabase/supabase-js";

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
  "illness_recovery",
  "post_injury",
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
const STATUSES = [
  "pending_match",
  "matched",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createUser({ email, fullName, role, phone }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: PASSWORD,
    user_metadata: { full_name: fullName, phone, role },
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
      fullName: "Demo Customer",
      role: "customer",
      phone: "+447700900001",
    },
    {
      email: "demo.cleaner@seed.mundoria.local",
      fullName: "Demo Cleaner",
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
    try {
      const user = await createUser({
        email,
        fullName: `${role === "customer" ? "Customer" : "Cleaner"} ${n}`,
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
}

/** Make cleaners eligible for almost any demo booking (service / day / B* postcode). */
async function makeCleanersMatchReady(cleanerIds) {
  if (!cleanerIds.length) return;

  await admin
    .from("cleaner_profiles")
    .update({
      bio: "Seeded Birmingham cleaner — available across Mundoria demo bookings.",
      dbs_verified: true,
      id_verified: true,
      onboarding_complete: true,
      references_verified: true,
      status: "active",
      working_radius_km: 80,
    })
    .in("id", cleanerIds);

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

  // Replace areas with a single Birmingham-wide prefix so any B* postcode matches.
  await admin.from("cleaner_working_areas").delete().in("cleaner_id", cleanerIds);
  await admin.from("cleaner_working_areas").insert(
    cleanerIds.map((cleaner_id) => ({
      cleaner_id,
      ...MATCH_AREA,
    })),
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
    const status = STATUSES[i % STATUSES.length];
    const total = 4500 + (i % 40) * 250;
    const cleaner = Math.floor(total * 0.8);
    rows.push({
      address_id: address.id,
      amount_cleaner: cleaner,
      amount_platform: total - cleaner,
      amount_total: total,
      cleaner_id:
        status === "pending_match"
          ? null
          : cleanerIds[i % cleanerIds.length] ?? null,
      customer_id: address.customer_id,
      estimated_duration_hours: 2 + (i % 4),
      is_recurring: false,
      payment_status:
        status === "completed"
          ? "released"
          : status === "cancelled"
            ? "refunded"
            : "held",
      scheduled_date: new Date(Date.now() + ((i % 60) - 20) * 86400000)
        .toISOString()
        .slice(0, 10),
      scheduled_start_time: ["09:00", "10:00", "11:00", "14:00", "16:00"][i % 5],
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

const RATING_COMMENTS = [
  "Kitchen and bathrooms looked genuinely finished — not a rushed wipe.",
  "Clear updates throughout and the checklist matched what we asked for.",
  "Punctual, careful and professional. Would book again.",
  "End-of-tenancy photos made the agent handover much easier.",
  "Guest-ready every time for our short-let — status stays in the app.",
  "Prefer same cleaner worked for us. Communication stayed clear.",
  "Empty-property clean left it ready for the new keys.",
  "Special-attention notes were actually followed. Thorough finish.",
];

async function seedRatings() {
  const { data: bookings, error } = await admin
    .from("bookings")
    .select("id,customer_id,cleaner_id")
    .eq("status", "completed")
    .not("cleaner_id", "is", null)
    .limit(80);
  if (error) {
    console.warn("ratings load error:", error.message);
    return;
  }
  if (!bookings?.length) {
    console.log("No completed bookings — skip ratings");
    return;
  }

  const rows = bookings.map((booking, i) => ({
    application_status: "applied",
    booking_id: booking.id,
    cleaner_id: booking.cleaner_id,
    comment: RATING_COMMENTS[i % RATING_COMMENTS.length],
    customer_id: booking.customer_id,
    overall_score: 4.5 + (i % 6) * 0.1,
    room_ratings: { bathroom: 5, kitchen: 5 },
  }));

  const { error: insertError } = await admin.from("ratings").upsert(rows, {
    onConflict: "booking_id",
    ignoreDuplicates: true,
  });
  if (insertError) {
    console.warn("ratings seed error:", insertError.message);
    return;
  }
  console.log(`Seeded up to ${rows.length} ratings on completed bookings`);
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
