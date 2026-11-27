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

const tileLabel =
  "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

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

/** Format address without repeating city/postcode already in the street line. */
export function formatJobAddress(address: CleanerJob["address"]) {
  if (!address) return "Not available";
  const line1 = address.address_line_1?.trim() || "";
  const line2 = address.address_line_2?.trim() || "";
  const city = address.city?.trim() || "";
  const postcode = address.postcode?.trim() || "";
  const lower = `${line1} ${line2}`.toLowerCase();
  const parts = [line1 || null, line2 || null];
  if (city && !lower.includes(city.toLowerCase())) parts.push(city);
  if (postcode && !lower.includes(postcode.toLowerCase())) parts.push(postcode);
  return parts.filter(Boolean).join(", ") || "Not available";
}

/** Everything a cleaner needs to know about a job, each with what it means for them. */
export function JobBrief({
  hidePay = false,
  job,
}: {
  hidePay?: boolean;
  job: CleanerJob;
}) {
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
            explain:
              "Other cleaners are booked for this visit. Agree who does which rooms when you arrive.",
            label: "Team size",
            value: `${team} cleaners`,
          },
        ]
      : []),
  ];

  const roomParts = [
    rooms.booked_num_bedrooms != null
      ? plural(rooms.booked_num_bedrooms, "bedroom")
      : null,
    rooms.booked_num_bathrooms != null
      ? plural(rooms.booked_num_bathrooms, "bathroom")
      : null,
    rooms.booked_num_other_rooms
      ? `${plural(rooms.booked_num_other_rooms, "other room")}${
          rooms.booked_other_room_types?.length
            ? ` (${rooms.booked_other_room_types.join(", ").replaceAll("_", " ")})`
            : ""
        }`
      : null,
  ].filter(Boolean) as string[];
  const propertyType = rooms.booked_property_type ?? address?.property_type ?? null;
  const condition = job.property_condition
    ? CONDITIONS[job.property_condition]
    : null;

  const property: Fact[] = [
    {
      explain: "Where the clean takes place. Use the map to plan your journey.",
      label: "Address",
      value: formatJobAddress(address),
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
            explain:
              "The rooms the customer booked for. The booked time is based on these.",
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
            explain:
              "Cupboards and surfaces may have dust or residue from the move.",
            label: "Recently moved",
            value: "Yes",
          },
        ]
      : []),
    ...((job as { access_instructions?: string | null }).access_instructions?.trim()
      ? [
          {
            explain:
              "How to get in for this visit, from the customer. Follow these first.",
            label: "Access instructions",
            value: (
              job as { access_instructions?: string | null }
            ).access_instructions!.trim(),
          },
        ]
      : []),
    ...(address?.special_requirements?.trim()
      ? [
          {
            explain:
              "Saved by the customer for this address, such as parking or how to get in.",
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
            explain:
              "Extra tasks the customer added. They are part of this job and included in the booked time.",
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

  const groups: { facts: Fact[]; title: string }[] = [
    { facts: visit, title: "The visit" },
    { facts: property, title: "The property" },
    { facts: supplies, title: "Products and equipment" },
    { facts: requests, title: "Customer requests" },
  ];

  if (!hidePay) {
    groups.push({
      facts: [
        {
          explain:
            "What you earn for this job. It is paid into your next payout after the visit, once the customer's payment is taken the day after the clean.",
          label: "Your earnings",
          value: formatMoney(job.amount_cleaner),
        },
      ],
      title: "Your pay",
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
      <h2 className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[#1E1848] sm:text-[20px]">
        Job details
      </h2>

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className={tileLabel}>{group.title}</h3>
            <div className="mt-2.5 grid gap-2">
              {group.facts.map((fact) => (
                <div
                  className="rounded-[14px] bg-[#F3F4F6] px-4 py-3"
                  key={fact.label}
                >
                  <p className={tileLabel}>{fact.label}</p>
                  <p className="m-0 mt-1.5 text-[15px] font-semibold tracking-[-0.02em] text-[#1E1848]">
                    {fact.value}
                  </p>
                  <p className="m-0 mt-1 text-[12.5px] leading-5 text-[#5F5F66]">
                    {fact.explain}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
