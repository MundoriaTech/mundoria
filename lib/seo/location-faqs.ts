/**
 * Location FAQs for the city hub, neighbourhood hubs, area pages and nearby
 * towns. Every page shows the same six core answers (one source of truth for
 * prices, vetting, booking and cancellation) plus a few genuinely local
 * questions, so area pages stay useful without cloning one long FAQ.
 *
 * Answers are plain text: the same string is rendered on the page and sent in
 * FAQPage JSON-LD. Prices come from the live admin rate card.
 */
import {
  DEFAULT_SERVICE_PRICING,
  type ServicePricingConfig,
} from "@/lib/customer/pricing-config";
import {
  fromRateLabel,
  houseCleaningFromLabel,
  supplyRateCopy,
} from "@/lib/customer/published-pricing";
import {
  BIRMINGHAM_COVERAGE_ZONES,
  BIRMINGHAM_NEARBY_ZONE_ID,
  birminghamCoveragePlaceBySlug,
  birminghamCoverageZoneByHubSlug,
} from "@/lib/seo/birmingham-coverage";
import { FAQ_LINKS, faqSectionHref } from "@/lib/seo/faq-links";
import { birminghamAreaBySlug } from "@/lib/seo/marketing";

export type LocationFaqLink = { href: string; label: string };

export type LocationFaq = {
  answer: string;
  links?: LocationFaqLink[];
  question: string;
};

export type LocationFaqContext =
  | { kind: "city"; place: string }
  | { kind: "zone"; place: string; zoneId: string }
  | { kind: "town"; place: string }
  | { kind: "area"; place: string; local: LocationFaq[] }
  | { kind: "place"; place: string };

const P = (...paragraphs: string[]) => paragraphs.join("\n\n");

/** Work out which local questions belong on a place page. */
export function locationFaqContext(place: string, path: string): LocationFaqContext {
  const slug = path.split("?")[0]!.split("/").filter(Boolean).pop() ?? "";
  if (slug === "birmingham" && place === "Birmingham") {
    return { kind: "city", place };
  }

  const hub = birminghamCoverageZoneByHubSlug(slug);
  if (hub) return { kind: "zone", place, zoneId: hub.id };

  // Priority neighbourhoods carry their own hand-written local questions.
  const area = birminghamAreaBySlug(slug);
  if (area?.faqs.length) return { kind: "area", place, local: area.faqs };

  // City Centre, Erdington and Sutton Coldfield are place pages that are
  // also the hub for their zone.
  const namedZone = BIRMINGHAM_COVERAGE_ZONES.find(
    (zone) =>
      zone.id !== BIRMINGHAM_NEARBY_ZONE_ID &&
      zone.label.toLowerCase() === place.toLowerCase(),
  );
  if (namedZone) return { kind: "zone", place, zoneId: namedZone.id };

  const coverage = birminghamCoveragePlaceBySlug(slug);
  if (coverage?.zoneId === BIRMINGHAM_NEARBY_ZONE_ID) {
    return { kind: "town", place };
  }
  if (coverage) return { kind: "zone", place, zoneId: coverage.zoneId };

  return { kind: "place", place };
}

/** L01–L05 and L08 from the location FAQ standard. */
export function coreLocationFaqs(
  place: string,
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
): LocationFaq[] {
  const supply = supplyRateCopy(pricing);
  return [
    {
      question: `Can I book cleaning at my postcode in ${place}?`,
      answer: P(
        `Yes, you can request a clean anywhere in ${place}. Enter your full address when you book, choose the service, date and time, and Mundoria then matches a suitable cleaner who covers your postcode.`,
        `A page for ${place} means we take bookings here, not that every date and time is guaranteed. If no cleaner can accept the booking, you are told and you are not charged.`,
      ),
    },
    {
      question: `Which cleaning services can I book in ${place}?`,
      answer: P(
        "House cleaning (regular, one-off and deep cleans), moving cleans (move-in, move-out and end of tenancy), workspace cleaning (offices, retail and hospitality, educational and communal areas), short-let cleaning, and Recovery cleaning for times when keeping on top of the home is harder.",
        "Each service has its own page explaining what is included, so you can choose the one that fits the job rather than stretching a routine clean.",
      ),
      links: [{ href: "/cleaning", label: "All services and prices" }],
    },
    {
      question: `How much does cleaning cost in ${place}?`,
      answer: P(
        `Each service has an hourly rate. House cleaning starts from ${houseCleaningFromLabel(pricing)}, deep and moving cleans from ${fromRateLabel("deep_clean", pricing)}, and office cleaning from ${fromRateLabel("office", pricing)}. The rates are the same in every area we cover.`,
        `Your total is the rate multiplied by the hours your property needs, plus anything you add: cleaning products (${supply.productsResidential}) or equipment (${supply.equipmentDefault}, ${supply.equipmentDeep} for deep cleaning), and higher rates for early, evening and weekend times. There is no booking fee or travel charge, and you see the full price before you confirm.`,
      ),
      links: [{ href: "/cleaning", label: "See every rate" }],
    },
    {
      question: "How do I book, and when is my clean confirmed?",
      answer: P(
        "Choose the service, enter your address and property details, pick a date and time and save a card. Nothing is charged at that point.",
        "Your booking is a request until a cleaner accepts it. You can follow the status in your account and you are notified when a cleaner is confirmed. From 48 hours before the visit, once a cleaner is assigned, a temporary hold is placed on your card, and the payment is taken the day after the clean.",
      ),
      links: [
        { href: "/how-it-works", label: "How Mundoria works" },
        { href: FAQ_LINKS.whenCharged, label: "When you are charged" },
      ],
    },
    {
      question: "How does Mundoria check the cleaner who visits?",
      answer: P(
        "Before anyone can take bookings, Mundoria checks their identity and right to work, reviews a Basic DBS certificate, looks at their cleaning experience and holds an interview with them.",
        "Every cleaner must have at least £1 million of Public Liability insurance, and anyone whose cover expires is taken out of matching until it is renewed. Insurance has limits and does not cover every loss, so if something goes wrong, report it through Mundoria and it is reviewed on its facts.",
      ),
      links: [{ href: faqSectionHref("safety"), label: "Safety and vetting" }],
    },
    {
      question: "Can I cancel or reschedule, and when is there a charge?",
      answer: P(
        "Cancel or reschedule free of charge 24 hours or more before the start time. Within 24 hours, the full booking price is charged, because the cleaner has set that time aside.",
        "If the cleaner or Mundoria cannot carry out the booking, you are not charged for it. Your statutory consumer rights are not affected.",
      ),
      links: [{ href: FAQ_LINKS.cancellationFee, label: "Cancellation details" }],
    },
  ];
}

/** Two local questions per neighbourhood hub (pages 247–249 of the brief). */
const ZONE_FAQS: Record<string, LocationFaq[]> = {
  central: [
    {
      question: "Can I book cleaning for a city-centre flat or apartment?",
      answer: P(
        "Yes. Choose the service, select a flat as the property type and give the number of bedrooms and bathrooms so the time estimate fits the space.",
        "Apartment cleaning covers the same rooms as a house clean. If the flat is a short-let between guests, book short-let cleaning instead so the turnaround is planned around check-out and check-in.",
      ),
      links: [{ href: "/cleaning/residential", label: "House and flat cleaning" }],
    },
    {
      question: "How does the cleaner get into a building with a concierge or intercom?",
      answer: P(
        "Add it to the access instructions: how to get into the building, which buzzer or concierge desk to use, the flat number and where any key will be left. The cleaner only uses the access you give for that booking.",
        "If parking or loading near the building is restricted, say so in the notes. Mundoria cannot promise free parking in the city centre.",
      ),
      links: [{ href: FAQ_LINKS.accessNotHome, label: "Access when you are not home" }],
    },
  ],
  west: [
    {
      question: "Can I book recurring cleaning in Edgbaston or Harborne?",
      answer: P(
        "Yes. Choose regular cleaning weekly or fortnightly, and you can ask for the same cleaner on later visits.",
        "Mundoria tries to keep the same person where possible, but it cannot be guaranteed. When your usual cleaner is away, a suitable replacement is looked for, and you can stop future visits at any time without a minimum term.",
      ),
      links: [{ href: "/cleaning/regular-cleaning", label: "Regular cleaning" }],
    },
    {
      question: "Can an agent hand over keys for an end-of-tenancy clean in Harborne?",
      answer: P(
        "Yes. Book end of tenancy cleaning and put the agent's details in the access instructions, including where keys are collected and returned.",
        "Make sure the agent knows the date and has agreed to release the keys to the cleaner. Mundoria does not hold customer keys itself.",
      ),
      links: [{ href: "/cleaning/end-of-tenancy-cleaning", label: "End of tenancy cleaning" }],
    },
  ],
  "south-west": [
    {
      question: "Can I book an end-of-tenancy clean for a shared house in Selly Oak?",
      answer: P(
        "Yes. Book end of tenancy cleaning for the whole property and give the number of bedrooms, bathrooms and shared rooms so the time estimate fits.",
        "Whoever books needs authority to arrange the clean, such as the landlord, the letting agent or the tenants leaving together. Agree the date with everyone moving out so rooms are empty when the cleaner arrives.",
      ),
      links: [{ href: "/cleaning/end-of-tenancy-cleaning", label: "End of tenancy cleaning" }],
    },
    {
      question: "In a shared house, which rooms will the cleaner go into?",
      answer: P(
        "Only the rooms included in the booking. List any occupied or private rooms in the notes as off limits, and the cleaner will stay out of them.",
        "Shared areas such as the kitchen, bathroom and hallway should be agreed by whoever has authority over the property, and the people living there should know the clean is happening.",
      ),
    },
  ],
  south: [
    {
      question: "Can I book regular, one-off and deep cleaning in Moseley and Kings Heath?",
      answer: P(
        "Yes, all three. Regular cleaning keeps on top of the home weekly or fortnightly, a one-off clean is a single visit, and a deep clean goes into the detail a routine clean skips.",
        "If the home has not been cleaned properly for a while, start with a deep clean, then move to regular visits to keep it there.",
      ),
      links: [
        { href: "/cleaning/regular-cleaning", label: "Regular cleaning" },
        { href: "/cleaning/deep-cleaning", label: "Deep cleaning" },
      ],
    },
    {
      question: "Can the cleaner use my own products or avoid certain rooms?",
      answer: P(
        "Yes. You can leave your own products for the cleaner to use, or add Mundoria's product kit when you book. Mention any fragrance-free or allergy needs in the notes.",
        "List any rooms or surfaces to avoid in the same notes, and the cleaner will follow those instructions on the day.",
      ),
    },
  ],
  "north-west": [
    {
      question: "Can a landlord book cleaning for shared areas only in Aston or Handsworth?",
      answer: P(
        "Yes. Book the clean for the shared areas, such as the kitchen, bathrooms, hallways and stairs, and list the private rooms the cleaner must not enter.",
        "The person booking needs authority over those shared areas, and the people living there should know when the clean is happening.",
      ),
      links: [{ href: "/cleaning/communal-area-cleaning", label: "Communal area cleaning" }],
    },
    {
      question: "How should I arrange access when several people live at the property?",
      answer: P(
        "Give one clear access route in the booking: who will let the cleaner in, or where a key safe is, and a contact number for the day. Agree in advance who is responsible so the cleaner is not left waiting.",
        "After a 5-minute grace period on arrival, a waiting charge of £0.50 a minute can apply while access is sorted out.",
      ),
      links: [{ href: FAQ_LINKS.accessFailed, label: "If the cleaner cannot get in" }],
    },
  ],
  "north-east": [
    {
      question: "What if my address is near the edge of Erdington?",
      answer: P(
        "It does not matter which area page you started from. Matching works from your actual postcode, so enter your full address when you book and Mundoria looks for a suitable cleaner who covers it.",
        "Prices are the same in every area we cover, so a boundary does not change what you pay.",
      ),
    },
    {
      question: "What happens if my regular cleaner in Erdington is unavailable?",
      answer: P(
        "Mundoria looks for a suitable replacement cleaner for that visit.",
        "If no one can take it, you are offered another time or the visit is cancelled, and you are not charged for a clean that did not happen.",
      ),
    },
  ],
  east: [
    {
      question: "Can the cleaner focus on selected rooms only in Alum Rock or Hodge Hill?",
      answer: P(
        "Yes. Say which rooms are included and which are off limits in the booking notes, and add your priorities so the time goes where it matters most.",
        "If other people live at the address, only book rooms you have the right to arrange cleaning for.",
      ),
    },
    {
      question: "What access details should I give if several households share an address?",
      answer: P(
        "Include the exact flat or unit number, which entrance or doorbell to use, how to get in and a contact number for the day.",
        "Clear details stop the cleaner waiting at the wrong door. After a 5-minute grace period on arrival, a waiting charge of £0.50 a minute can apply.",
      ),
      links: [{ href: FAQ_LINKS.accessNotHome, label: "Access instructions" }],
    },
  ],
  "south-east": [
    {
      question: "Can I book a move-out clean in Yardley and a move-in clean at my new home?",
      answer: P(
        "Yes. Book them as two separate cleans, one for each address, each with its own date, access and property details.",
        "They can be on the same day or different days, depending on when you have the keys for each property.",
      ),
      links: [
        { href: "/cleaning/move-in-move-out-cleaning", label: "Move-in and move-out cleaning" },
      ],
    },
    {
      question: "Can someone else let the cleaner in?",
      answer: P(
        "Yes. Name the person in the access instructions with a contact number, and make sure they know the date and time.",
        "The cleaner only uses the access route you give for that booking.",
      ),
    },
  ],
  sutton: [
    {
      question: "Can I book a deep clean for a larger home in Sutton Coldfield?",
      answer: P(
        "Yes. The booking estimates the hours from the bedrooms, bathrooms and condition you enter, and the price you see reflects those hours.",
        "For a larger home that has not had a thorough clean for a while, a deep clean is the better starting point before regular visits.",
      ),
      links: [{ href: "/cleaning/deep-cleaning", label: "Deep cleaning" }],
    },
    {
      question: "Can I have the same cleaner for recurring visits in Sutton Coldfield?",
      answer: P(
        "You can ask for the same cleaner on regular weekly or fortnightly visits, and Mundoria tries to keep that continuity.",
        "It cannot be guaranteed every time. When your usual cleaner is away, a suitable replacement is looked for.",
      ),
      links: [{ href: "/cleaning/regular-cleaning", label: "Regular cleaning" }],
    },
  ],
};

/** City hub: Birmingham-wide coverage questions. */
const CITY_FAQS: LocationFaq[] = [
  {
    question: "Which parts of Birmingham do you cover?",
    answer: P(
      "Mundoria takes bookings across Birmingham, grouped into nine areas: City Centre, Edgbaston & Harborne, Selly Oak & Bournville, Moseley & Kings Heath, Aston & Handsworth, Erdington, Alum Rock & Hodge Hill, Yardley & Sheldon, and Sutton Coldfield.",
      "Each area page lists the neighbourhoods inside it. Matching works from your full postcode, so enter your address when you book.",
    ),
  },
  {
    question: "Do you cover towns just outside Birmingham?",
    answer: P(
      "Yes, including Solihull, Shirley, Smethwick, Oldbury, West Bromwich, Halesowen, Bromsgrove, Walsall and Aldridge. You can book there when a cleaner who covers your postcode can take the visit.",
      "The same prices, checks and booking terms apply, with no travel charge.",
    ),
  },
];

type TownTopic = "confirmed" | "replacement" | "time" | "access" | "sameCleaner" | "price";

const TOWN_TOPICS: Record<string, TownTopic> = {
  Solihull: "sameCleaner",
  Shirley: "replacement",
  Olton: "price",
  "Hall Green / Solihull border": "price",
  Elmdon: "time",
  "Marston Green": "price",
  "Chelmsley Wood": "sameCleaner",
  "Castle Bromwich": "time",
  "Smith's Wood": "access",
  Kingshurst: "access",
  Fordbridge: "time",
  Bickenhill: "confirmed",
  Coleshill: "price",
  "Water Orton": "time",
  Knowle: "sameCleaner",
  Dorridge: "confirmed",
  "Hampton-in-Arden": "time",
  Hollywood: "price",
  Wythall: "price",
  "Barnt Green": "confirmed",
  Alvechurch: "time",
  "Cofton Hackett": "replacement",
  Bromsgrove: "replacement",
  Smethwick: "access",
  Bearwood: "price",
  Oldbury: "replacement",
  "West Bromwich": "price",
  "Rowley Regis": "replacement",
  Halesowen: "confirmed",
  "Cradley Heath": "access",
  Walsall: "time",
  Aldridge: "confirmed",
};

function townTopicFaq(town: string, topic: TownTopic): LocationFaq {
  switch (topic) {
    case "confirmed":
      return {
        question: `How will I know my booking in ${town} is confirmed?`,
        answer: P(
          "Your booking starts as a request. You can follow its status in your Mundoria account, and you are notified when a cleaner accepts it.",
          "If no cleaner can take it, the booking is cancelled and you are not charged.",
        ),
      };
    case "replacement":
      return {
        question: `What happens if my cleaner cancels a booking in ${town}?`,
        answer: P(
          "Mundoria looks for a suitable replacement who covers your postcode.",
          "If no one can take it, you are offered another time or the booking is cancelled, and you are not charged for a clean that did not happen.",
        ),
      };
    case "time":
      return {
        question: `What if my chosen time is not available in ${town}?`,
        answer: P(
          `Choosing a time does not guarantee a cleaner can take it, and fewer cleaners travel to ${town} than to central Birmingham.`,
          "If no cleaner accepts, you are told and not charged, and you can book again for another day or time.",
        ),
      };
    case "access":
      return {
        question: `Can a neighbour, landlord or agent let the cleaner in at my ${town} address?`,
        answer: P(
          "Yes. Name the person in the access instructions with a contact number, and make sure they know the date and time and have agreed to it.",
          "The cleaner only uses the access route you give for that booking. Mundoria does not hold customer keys itself.",
        ),
        links: [{ href: FAQ_LINKS.accessNotHome, label: "Access when you are not home" }],
      };
    case "sameCleaner":
      return {
        question: `Can I have the same cleaner again in ${town}?`,
        answer: P(
          "You can ask for the same cleaner on regular visits, and Mundoria tries to keep that continuity.",
          `It cannot be guaranteed, especially outside central Birmingham where fewer cleaners cover ${town}. When your usual cleaner is away, a suitable replacement is looked for.`,
        ),
      };
    case "price":
      return {
        question: `Is there a travel charge for cleaning in ${town}?`,
        answer: P(
          "No. The same hourly rates apply in every area Mundoria covers, and there is no separate travel or booking fee.",
          "The full price, including any products, equipment or early, evening or weekend rates you choose, is shown before you confirm.",
        ),
      };
  }
}

function townFaqs(town: string): LocationFaq[] {
  return [
    {
      question: `${town} is outside Birmingham. Does that change anything?`,
      answer: P(
        "The prices, cleaner checks and booking terms are the same as in Birmingham.",
        `What changes is availability: bookings in ${town} depend on cleaners who travel to your postcode, so some dates and times are harder to match than in central areas.`,
      ),
    },
    townTopicFaq(town, TOWN_TOPICS[town] ?? "time"),
  ];
}

/** Core six plus the local questions for this page (8 on hubs). */
export function locationFaqs(
  context: LocationFaqContext,
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
): LocationFaq[] {
  const core = coreLocationFaqs(context.place, pricing);
  switch (context.kind) {
    case "city":
      return [...core, ...CITY_FAQS];
    case "zone":
      return [...core, ...(ZONE_FAQS[context.zoneId] ?? [])];
    case "town":
      return [...core, ...townFaqs(context.place)];
    case "area":
      return [...core, ...context.local];
    default:
      return core;
  }
}

export function locationFaqJsonLd(items: LocationFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer", text: item.answer },
      name: item.question,
    })),
  };
}
