import {
  CLEANER_AGREEMENT_DOCS,
  PREFERRED_HOURS_BANDS,
  TRANSPORT_MODE_OPTIONS,
  parseTransportModes,
} from "@/lib/cleaner/onboarding-compliance";
import { formatInterviewSlot } from "@/lib/cleaner/interview-slots";
import { formatServiceName } from "@/lib/customer/services";
import type { ServiceType } from "@/types/customer";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const OWNERSHIP: Record<string, string> = {
  yes: "Yes, their own",
  some: "Some of their own",
  none: "None yet",
};

const UTR_PATH: Record<string, string> = {
  have: "Has a UTR",
  none: "Does not have one yet",
  unsure: "Unsure",
  waiting: "Waiting for HMRC",
};

const DBS_PATH: Record<string, string> = {
  have: "Has a DBS certificate",
  apply: "Still applying",
  waiting: "Waiting for the certificate",
};

const INSURANCE_PATH: Record<string, string> = {
  have: "Has cover",
  none: "Does not have cover yet",
  unsure: "Unsure",
};

type Fact = { label: string; value: string };

export function CleanerApplicationRecord({
  agreements,
  areas,
  availability,
  bio,
  cleaningSkills,
  cleaningSkillsOther,
  dbsCertificateNumber,
  dbsIssuedOn,
  dbsPath,
  emergency,
  equipmentOwned,
  equipmentOther,
  equipmentOwnership,
  experienceBand,
  fullName,
  gender,
  insuranceActivityConfirmed,
  insuranceInsuredName,
  insurancePath,
  insurancePolicyNumber,
  insuranceProvider,
  interviewScheduledAt,
  locationConsentAt,
  marketingConsentAt,
  phone,
  preferredHoursBand,
  productsOwned,
  productsOther,
  productsOwnership,
  reference,
  safetyAcknowledgedAt,
  services,
  skillsExamScore,
  transportMode,
  utrNumber,
  utrPath,
  workingRadiusKm,
  yearsExperience,
}: {
  agreements: Array<{ accepted_at: string; key: string; version: string }>;
  areas: Array<{
    latitude: number | null;
    longitude: number | null;
    postcode_prefix: string | null;
  }>;
  availability: Array<{
    day_of_week: number;
    end_time: string;
    is_available: boolean;
    start_time: string;
  }>;
  bio: string | null;
  cleaningSkills: string[];
  cleaningSkillsOther: string | null;
  dbsCertificateNumber: string | null;
  dbsIssuedOn: string | null;
  dbsPath: string | null;
  emergency: Record<string, string> | null;
  equipmentOwned: string[];
  equipmentOther: string | null;
  equipmentOwnership: string | null;
  experienceBand: string | null;
  fullName: string;
  gender: string | null;
  insuranceActivityConfirmed: boolean | null;
  insuranceInsuredName: string | null;
  insurancePath: string | null;
  insurancePolicyNumber: string | null;
  insuranceProvider: string | null;
  interviewScheduledAt: string | null;
  locationConsentAt: string | null;
  marketingConsentAt: string | null;
  phone: string | null;
  preferredHoursBand: string | null;
  productsOwned: string[];
  productsOther: string | null;
  productsOwnership: string | null;
  reference: {
    company: string | null;
    contactOk: boolean | null;
    email: string | null;
    name: string | null;
    phone: string | null;
    relationship: string | null;
  };
  safetyAcknowledgedAt: string | null;
  services: string[];
  skillsExamScore: number | null;
  transportMode: string | null;
  utrNumber: string | null;
  utrPath: string | null;
  workingRadiusKm: number;
  yearsExperience: number;
}) {
  const hoursLabel =
    PREFERRED_HOURS_BANDS.find((band) => band.value === preferredHoursBand)
      ?.label ?? pretty(preferredHoursBand);
  const { modes, otherText } = parseTransportModes(transportMode ?? "");
  const transportLabel = [
    ...modes.map(
      (mode) =>
        TRANSPORT_MODE_OPTIONS.find((option) => option.value === mode)?.label ??
        pretty(mode),
    ),
    otherText,
  ]
    .filter(Boolean)
    .join(", ");

  const groups: Array<{ title: string; facts: Fact[] }> = [
    {
      title: "About you",
      facts: [
        fact("Full name", fullName),
        fact("Phone", phone),
        fact("Gender", gender),
        fact(
          "Years of experience",
          yearsExperience != null ? String(yearsExperience) : null,
        ),
        fact("Experience band", pretty(experienceBand)),
        fact("About them", bio),
        fact(
          "Cleaning skills",
          joinList([
            ...cleaningSkills.filter((item) => item !== "Other (please specify)"),
            cleaningSkillsOther,
          ]),
        ),
      ],
    },
    {
      title: "Your services",
      facts: [
        fact(
          "Services they offer",
          services.length
            ? services.map((item) => formatServiceName(item as ServiceType)).join(", ")
            : null,
        ),
      ],
    },
    {
      title: "When they want to work",
      facts: [
        fact("Preferred hours each week", hoursLabel),
        fact("Usual days and times", formatAvailability(availability)),
      ],
    },
    {
      title: "Where they want to work",
      facts: [
        fact(
          "Areas",
          areas
            .map((area) => area.postcode_prefix)
            .filter(Boolean)
            .join(", "),
        ),
        fact(
          "Travel radius",
          workingRadiusKm
            ? `${Math.max(1, Math.round(workingRadiusKm / 1.609344))} miles`
            : null,
        ),
        fact("How they get there", transportLabel),
      ],
    },
    {
      title: "UTR",
      facts: [
        fact("What they told us", UTR_PATH[utrPath ?? ""] ?? pretty(utrPath)),
        fact("UTR number", utrNumber),
      ],
    },
    {
      title: "DBS",
      facts: [
        fact("What they told us", DBS_PATH[dbsPath ?? ""] ?? pretty(dbsPath)),
        fact("Certificate number", dbsCertificateNumber),
        fact("Issued on", formatUkDate(dbsIssuedOn)),
      ],
    },
    {
      title: "Insurance",
      facts: [
        fact(
          "What they told us",
          INSURANCE_PATH[insurancePath ?? ""] ?? pretty(insurancePath),
        ),
        fact("Provider", insuranceProvider),
        fact("Policy number", insurancePolicyNumber),
        fact("Name on the policy", insuranceInsuredName),
        fact(
          "Confirmed it covers cleaning work",
          insuranceActivityConfirmed == null
            ? null
            : insuranceActivityConfirmed
              ? "Yes"
              : "No",
        ),
      ],
    },
    {
      title: "Equipment and products",
      facts: [
        fact(
          "Own products",
          OWNERSHIP[productsOwnership ?? ""] ?? pretty(productsOwnership),
        ),
        fact("Products they bring", joinList([...productsOwned, productsOther])),
        fact(
          "Own equipment",
          OWNERSHIP[equipmentOwnership ?? ""] ?? pretty(equipmentOwnership),
        ),
        fact(
          "Equipment they bring",
          joinList([...equipmentOwned, equipmentOther]),
        ),
      ],
    },
    {
      title: "Quiz",
      facts: [
        fact(
          "Score",
          skillsExamScore != null ? `${skillsExamScore} out of 12` : null,
        ),
      ],
    },
    {
      title: "Location consent",
      facts: [
        fact(
          "GPS check-in and check-out",
          locationConsentAt
            ? `Accepted ${formatUkDateTime(locationConsentAt)}`
            : null,
        ),
      ],
    },
    {
      title: "Appointment",
      facts: [
        fact(
          "Onboarding call",
          interviewScheduledAt
            ? formatInterviewSlot(interviewScheduledAt)
            : null,
        ),
      ],
    },
    {
      title: "Emergency contact",
      facts: [
        fact("Name", emergency?.name),
        fact(
          "Relationship",
          emergency?.relationship === "other"
            ? emergency.relationship_other || "Other"
            : pretty(emergency?.relationship),
        ),
        fact("Mobile", emergency?.mobile),
        fact("Alternative phone", emergency?.alt_phone),
        fact("Email", emergency?.email),
        fact("Country", emergency?.country),
        fact(
          "They know they are listed",
          emergency?.informed ? pretty(emergency.informed) : null,
        ),
        fact(
          "Safety guidelines",
          safetyAcknowledgedAt
            ? `Acknowledged ${formatUkDateTime(safetyAcknowledgedAt)}`
            : null,
        ),
      ],
    },
    {
      title: "Agreements",
      facts: [
        ...CLEANER_AGREEMENT_DOCS.map((doc) => {
          const accepted = agreements.find((item) => item.key === doc.key);
          return fact(
            doc.label,
            accepted
              ? `Accepted ${formatUkDateTime(accepted.accepted_at)}`
              : "Not accepted",
          );
        }),
        fact(
          "Marketing emails and SMS",
          marketingConsentAt
            ? `Yes · ${formatUkDateTime(marketingConsentAt)}`
            : "No",
        ),
        fact(
          "Work reference",
          reference.name
            ? [
                reference.name,
                reference.relationship,
                reference.company,
                reference.phone,
                reference.email,
                reference.contactOk === false
                  ? "asked us not to contact them"
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : "Not given",
        ),
      ],
    },
  ];

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">Application answers</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything they filled in during onboarding, in the same order they saw
        it.
      </p>
      <div className="mt-4 space-y-5">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-foreground">
              {group.title}
            </h3>
            <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
              {group.facts.map((row) => (
                <div key={row.label}>
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="whitespace-pre-wrap font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function fact(label: string, value: string | null | undefined): Fact {
  const trimmed = String(value ?? "").trim();
  return { label, value: trimmed || "Not given" };
}

function pretty(value: string | null | undefined) {
  if (!value?.trim()) return "";
  return value.replaceAll("_", " ");
}

function joinList(values: Array<string | null | undefined>) {
  const items = values
    .map((item) => String(item ?? "").trim())
    .filter((item) => item && item !== "Other (please specify)");
  return items.join(", ");
}

function formatAvailability(
  rows: Array<{
    day_of_week: number;
    end_time: string;
    is_available: boolean;
    start_time: string;
  }>,
) {
  const open = rows.filter((row) => row.is_available);
  if (!open.length) return "";
  const byDay = new Map<number, string[]>();
  for (const row of open) {
    const stamp = `${String(row.start_time).slice(0, 5)}–${String(row.end_time).slice(0, 5)}`;
    const list = byDay.get(row.day_of_week) ?? [];
    list.push(stamp);
    byDay.set(row.day_of_week, list);
  }
  return Array.from(byDay.entries())
    .sort(([left], [right]) => left - right)
    .map(
      ([day, times]) =>
        `${DAY_NAMES[day] ?? `Day ${day}`} ${times.join(", ")}`,
    )
    .join("\n");
}

function formatUkDate(isoDate: string | null | undefined) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatUkDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
