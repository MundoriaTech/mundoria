import {
  bookingServiceName,
  CLEANING_STANDARDS,
  formatMoney,
  serviceDefinition,
  standardLabel,
} from "@/lib/customer/services";
import type { CleanerJob } from "@/types/cleaner";
import type { ServiceType } from "@/types/customer";

type Fact = { explain: string; label: string; value: string };

const PRODUCTS_ADD_ON = "cleaning_products";
const EQUIPMENT_ADD_ON = "cleaning_equipment";

const PROPERTY_TYPES: Record<string, string> = {
  flat: "Flat",
  house: "House",
  office: "Office",
  other: "Other",
};

const CONDITIONS: Record<string, { explain: string; value: string }> = {
  extra_attention: {
    explain: "Some areas will need more time than a routine clean. Focus there first.",
    value: "Needs a little extra attention",
  },
  maintained: {
    explain: "The home is cleaned regularly, so expect a routine clean.",
    value: "Cleaned regularly",
  },
  neglected: {
    explain:
      "It hasn't been cleaned for a while. Prioritise kitchen and bathrooms, and tell us early if the booked time won't be enough.",
    value: "Not cleaned for some time",
  },
};

type BookedRooms = {
  booked_num_bathrooms?: number | null;
  booked_num_bedrooms?: number | null;
  booked_num_other_rooms?: number | null;
  booked_other_room_types?: string[] | null;
  booked_property_type?: string | null;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function longDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  });
}

function finishTime(start: string, hours: number) {
  const [h, m] = start.slice(0, 5).split(":").map(Number);
  const total = h * 60 + m + Math.round(hours * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function hoursLabel(hours: number) {
  const rounded = Number(hours.toFixed(2));
  return `${rounded} hour${rounded === 1 ? "" : "s"}`;
}

/** Everything a cleaner needs to know about a job, each with what it means for them. */
export function JobBrief({ job }: { job: CleanerJob }) {
  const rooms = job as CleanerJob & BookedRooms;
  const address = job.address;
  const hours = Number(job.estimated_duration_hours ?? 0);
  const start = job.scheduled_start_time.slice(0, 5);
  const standard = job.cleaning_standard ?? "enhanced";
  const standardInfo = CLEANING_STANDARDS.find((item) => item.value === standard);
  const addOns = job.add_ons ?? [];
  const bringsProducts = addOns.some((item) => item.add_on_id === PRODUCTS_ADD_ON);
  const bringsEquipment = addOns.some((item) => item.add_on_id === EQUIPMENT_ADD_ON);
  const extras = addOns.filter(
    (item) => item.add_on_id !== PRODUCTS_ADD_ON && item.add_on_id !== EQUIPMENT_ADD_ON,
  );
  const team = Math.max(1, Number(job.allocated_cleaners ?? 1));
  let serviceExplain = "";
  try {
    serviceExplain = serviceDefinition(job.service_type as ServiceType).description;
  } catch {
    serviceExplain = "";
  }

  const visit: Fact[] = [
    {
      explain: serviceExplain || "The type of clean the customer booked.",
      label: "Service",
      value: bookingServiceName(job),
    },
    {
      explain: "Arrive on time. Check in from this page when you get there.",
      label: "Date and start time",
      value: `${longDate(job.scheduled_date)} at ${start}`,
    },
    ...(hours > 0
      ? [
          {
            explain: `The customer has booked ${hoursLabel(hours)}, so plan to finish by ${finishTime(start, hours)}. If you need longer, ask for extra time from this page while the clean is in progress.`,
            label: "Time booked",
            value: hoursLabel(hours),
          },
        ]
      : []),
    {
      explain:
        standardInfo?.description ??
        "How thorough the customer expects the clean to be.",
      label: "Cleaning standard",
      value: standardLabel(standard),
    },
    ...(team > 1
      ? [
          {
            explain: "Other cleaners are booked for this visit. Agree who does which rooms when you arrive.",
            label: "Team size",
            value: `${team} cleaners`,
          },
        ]
      : []),
  ];

  const roomParts = [
    rooms.booked_num_bedrooms != null ? plural(rooms.booked_num_bedrooms, "bedroom") : null,
    rooms.booked_num_bathrooms != null ? plural(rooms.booked_num_bathrooms, "bathroom") : null,
    rooms.booked_num_other_rooms
      ? `${plural(rooms.booked_num_other_rooms, "other room")}${
          rooms.booked_other_room_types?.length
            ? ` (${rooms.booked_other_room_types.join(", ").replaceAll("_", " ")})`
            : ""
        }`
      : null,
  ].filter(Boolean) as string[];
  const propertyType = rooms.booked_property_type ?? address?.property_type ?? null;
  const condition = job.property_condition ? CONDITIONS[job.property_condition] : null;

  const property: Fact[] = [
    {
      explain: "Where the clean takes place. Use the map to plan your journey.",
      label: "Address",
      value:
        [address?.address_line_1, address?.address_line_2, address?.city, address?.postcode]
          .filter(Boolean)
          .join(", ") || "Not available",
    },
    ...(propertyType
      ? [
          {
            explain: "The kind of property you'll be cleaning.",
            label: "Property type",
            value: PROPERTY_TYPES[propertyType] ?? propertyType,
          },
        ]
      : []),
    ...(roomParts.length
      ? [
          {
            explain: "The rooms the customer booked for. The booked time is based on these.",
            label: "Rooms",
            value: roomParts.join(", "),
          },
        ]
      : []),
    ...(condition
      ? [{ explain: condition.explain, label: "Condition", value: condition.value }]
      : []),
    ...(job.recently_moved
      ? [
          {
            explain: "Cupboards and surfaces may have dust or residue from the move.",
            label: "Recently moved",
            value: "Yes",
          },
        ]
      : []),
    ...(address?.special_requirements?.trim()
      ? [
          {
            explain: "Saved by the customer for this address, such as parking or how to get in.",
            label: "Address notes",
            value: address.special_requirements.trim(),
          },
        ]
      : []),
  ];

  const supplies: Fact[] = [
    {
      explain: bringsProducts
        ? "The customer paid for you to bring cleaning products. Bring what you need for the whole clean."
        : "The customer provides cleaning products. If something is missing, message them before the visit.",
      label: "Cleaning products",
      value: bringsProducts ? "You bring them" : "Customer provides",
    },
    {
      explain: bringsEquipment
        ? "The customer paid for you to bring equipment such as a vacuum, mop and bucket."
        : "The customer provides equipment such as a vacuum, mop and bucket. Check with them if you're unsure.",
      label: "Cleaning equipment",
      value: bringsEquipment ? "You bring it" : "Customer provides",
    },
  ];

  const requests: Fact[] = [
    ...(extras.length
      ? [
          {
            explain: "Extra tasks the customer added. They are part of this job and included in the booked time.",
            label: "Add-ons",
            value: extras.map((item) => item.label).join(", "),
          },
        ]
      : []),
    ...(job.special_attention_areas?.length
      ? [
          {
            explain: "Areas the customer wants you to focus on.",
            label: "Special attention",
            value: job.special_attention_areas.join(", ").replaceAll("_", " "),
          },
        ]
      : []),
    {
      explain: job.special_instructions?.trim()
        ? "Written by the customer when booking, including whether there are pets. Read before you arrive."
        : "The customer didn't leave any notes.",
      label: "Notes from the customer",
      value: job.special_instructions?.trim() || "None",
    },
  ];

  const pay: Fact[] = [
    {
      explain:
        "What you earn for this job. It is paid into your next payout after the visit, once the customer's payment is taken the day after the clean.",
      label: "Your earnings",
      value: formatMoney(job.amount_cleaner),
    },
  ];

  const groups: { facts: Fact[]; title: string }[] = [
    { facts: visit, title: "The visit" },
    { facts: property, title: "The property" },
    { facts: supplies, title: "Products and equipment" },
    { facts: requests, title: "Customer requests" },
    { facts: pay, title: "Your pay" },
  ];

  return (
    <section className="rounded-xl border bg-background p-5">
      <h2 className="font-semibold">Job details</h2>
      {job.customer?.full_name ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Customer: {job.customer.full_name}
        </p>
      ) : null}
      <div className="mt-4 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.title}
            </h3>
            <dl className="mt-2 divide-y rounded-lg border">
              {group.facts.map((fact) => (
                <div className="px-4 py-3" key={fact.label}>
                  <dt className="text-xs font-medium text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-foreground">{fact.value}</dd>
                  <dd className="mt-1 text-xs leading-5 text-muted-foreground">{fact.explain}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
