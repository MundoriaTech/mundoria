/**
 * Ordinary names for numbered seed accounts.
 * Index 0 is a woman, then the list alternates. Keep this in step with
 * public.demo_person_name in the seed-demo-names migration.
 */

export const DEMO_FIRST_NAMES = [
  "Amara",
  "James",
  "Priya",
  "Daniel",
  "Olivia",
  "Noah",
  "Fatima",
  "Marcus",
  "Elena",
  "Owen",
  "Hannah",
  "Hassan",
  "Sophie",
  "Callum",
  "Aisha",
  "Leo",
  "Grace",
  "Samuel",
  "Mei",
  "Yusuf",
  "Nia",
  "Ben",
  "Chloe",
  "Arjun",
  "Freya",
  "Elliot",
  "Yasmin",
  "Jack",
  "Lucy",
  "Omar",
  "Hana",
  "Felix",
  "Ruth",
  "Harry",
  "Zara",
  "Kwame",
  "Imogen",
  "Nathan",
  "Leila",
  "Oscar",
  "Maya",
  "Rohan",
  "Nora",
  "Theo",
  "Isla",
  "William",
  "Keisha",
  "Adam",
];

export const DEMO_LAST_NAMES = [
  "Adeyemi",
  "Bennett",
  "Chowdhury",
  "Davies",
  "Edwards",
  "Farooq",
  "Gallagher",
  "Hussain",
  "Iqbal",
  "Jones",
  "Khan",
  "Lawson",
  "Mensah",
  "Nkosi",
  "Okonkwo",
  "Patel",
  "Quinn",
  "Rahman",
  "Singh",
  "Thompson",
  "Uddin",
  "Vaughan",
  "Walker",
  "Yusuf",
  "Zhang",
  "Brooks",
  "Carter",
  "Doyle",
  "Ellis",
  "Foster",
];

/** Cleaner series is shifted so cleaner 1 is not the same person as customer 1. */
export const CLEANER_NAME_OFFSET = 240;

export const BIRMINGHAM_DISTRICTS = [
  { area: "Jewellery Quarter", prefix: "B1" },
  { area: "Jewellery Quarter", prefix: "B3" },
  { area: "Moseley", prefix: "B13" },
  { area: "Kings Heath", prefix: "B14" },
  { area: "Edgbaston", prefix: "B15" },
  { area: "Edgbaston", prefix: "B16" },
  { area: "Harborne", prefix: "B17" },
  { area: "Selly Oak", prefix: "B29" },
];

export function demoPerson(n) {
  const index = Math.max(1, Number(n)) - 1;
  const firstIndex = index % DEMO_FIRST_NAMES.length;
  const lastIndex =
    Math.floor(index / DEMO_FIRST_NAMES.length) % DEMO_LAST_NAMES.length;
  return {
    fullName: `${DEMO_FIRST_NAMES[firstIndex]} ${DEMO_LAST_NAMES[lastIndex]}`,
    gender: firstIndex % 2 === 0 ? "woman" : "man",
  };
}

export function districtForId(id) {
  const hex = String(id).replace(/-/g, "").slice(0, 6);
  const n = Number.parseInt(hex, 16) || 0;
  return BIRMINGHAM_DISTRICTS[n % BIRMINGHAM_DISTRICTS.length];
}
