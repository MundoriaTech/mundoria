import Link from "next/link";
import type { ReactNode } from "react";

import type { CategoryFaq } from "@/components/marketing/service-category/service-category-marketing-page";
import { FAQ_LINKS } from "@/lib/seo/faq-links";
import {
  LAUNCH_CITY,
  marketingServiceBySlug,
  type MarketingService,
} from "@/lib/seo/marketing";
import type { ServiceType } from "@/types/customer";

type FaqPoint = { description: ReactNode; name: string };

const linkClass =
  "font-semibold text-[#6a45b8] underline-offset-2 hover:underline";

function FaqLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link className={linkClass} href={href}>
      {children}
    </Link>
  );
}

function withBookingParam(href: string, key: string, value: string) {
  if (!href.startsWith("/booking/new")) return href;
  const url = new URL(href, "https://mundoria.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

function faq(
  question: string,
  answer: ReactNode,
  extras?: {
    after?: ReactNode;
    points?: FaqPoint[];
    pointsHeading?: string;
  },
): CategoryFaq {
  return {
    answer,
    answerAfter: extras?.after,
    question,
    services: extras?.points,
    servicesHeading: extras?.pointsHeading,
  };
}

function servicePhrase(service: MarketingService) {
  const label = service.label.toLowerCase();
  return label.endsWith("services") ? label : `${label} services`;
}

function serviceHref(slug: string) {
  return `/cleaning/${slug}`;
}

function relatedServiceLink(slug: string, label: string) {
  const service = marketingServiceBySlug(slug);
  return (
    <FaqLink href={serviceHref(slug)}>{service?.label.toLowerCase() ?? label}</FaqLink>
  );
}

export function serviceFaqsTitle(service: MarketingService) {
  return `Everything you need to know about ${servicePhrase(service)}`;
}

const INCLUDED: Partial<
  Record<ServiceType, { intro: ReactNode; points: FaqPoint[] }>
> = {
  regular: {
    intro: (
      <>
        A regular cleaning visit focuses on keeping your home tidy and fresh
        between deeper cleans. A typical session can include:
      </>
    ),
    points: [
      {
        name: "Dusting and surface care",
        description:
          "tables, shelves, counters and reachable surfaces wiped and dusted.",
      },
      {
        name: "Floor cleaning",
        description: "hoovering and mopping of the rooms included in the visit.",
      },
      {
        name: "Bathroom and toilet cleaning",
        description: "sinks, toilets, showers and surfaces left hygienic.",
      },
      {
        name: "Kitchen cleaning",
        description:
          "counters, sink, hob wipe and light tidy of small appliances.",
      },
      {
        name: "Beds and mirrors",
        description:
          "beds remade when clean linen is ready, and accessible mirrors polished.",
      },
      {
        name: "Bins",
        description: "rubbish emptied from the rooms covered by the booking.",
      },
    ],
  },
  deep_clean: {
    intro: (
      <>
        A deep clean goes beyond a{" "}
        {relatedServiceLink("regular-cleaning", "regular cleaning")} refresh and
        spends more time on detail. A typical visit can include:
      </>
    ),
    points: [
      {
        name: "Detailed kitchens and bathrooms",
        description: "fixtures, tile surrounds and high-use surfaces.",
      },
      {
        name: "Skirting, edges and hard-to-reach spots",
        description: "areas that get skipped on quicker visits.",
      },
      {
        name: "Floors throughout agreed rooms",
        description: "hoovering and mopping with more thorough attention.",
      },
      {
        name: "Dust and build-up reset",
        description: "a fuller clear-down so the home feels properly refreshed.",
      },
    ],
  },
  one_off: {
    intro: (
      <>
        A one-off clean is for a specific date — guests, a reset, or a catch-up.
        Prefer a repeating rhythm instead? See{" "}
        {relatedServiceLink("regular-cleaning", "regular cleaning")}. A typical
        visit can include:
      </>
    ),
    points: [
      {
        name: "Kitchen and bathroom focus",
        description: "the rooms guests notice first.",
      },
      {
        name: "Floors and surfaces",
        description: "hoovering, mopping and dusting in the rooms you include.",
      },
      {
        name: "Tidying as you go",
        description: "clear surfaces so cleaning time is spent on cleaning.",
      },
    ],
  },
  end_of_tenancy: {
    intro: (
      <>
        End of tenancy cleaning is built for handovers and deposit standards.
        Moving rather than ending a tenancy? See{" "}
        {relatedServiceLink(
          "move-in-move-out-cleaning",
          "move-in / move-out cleaning",
        )}
        . A typical visit can include:
      </>
    ),
    points: [
      {
        name: "Kitchen and appliances",
        description: "cupboards, hob, sink and visible appliance exteriors.",
      },
      {
        name: "Bathrooms and toilets",
        description: "a thorough clean ready for inspection.",
      },
      {
        name: "Floors throughout",
        description:
          "hoovering and mopping of the empty or nearly empty property.",
      },
      {
        name: "Skirting, doors and fittings",
        description: "detail work that often appears on checklists.",
      },
    ],
  },
  move_in: {
    intro: (
      <>
        Move-in and move-out cleaning resets the home for a new chapter. For
        landlord or agent handovers, see{" "}
        {relatedServiceLink("end-of-tenancy-cleaning", "end of tenancy cleaning")}
        . A typical visit can include:
      </>
    ),
    points: [
      {
        name: "Empty-home focus",
        description: "floors, kitchens and bathrooms when furniture is clear.",
      },
      {
        name: "Cupboards and surfaces",
        description: "wiped ready for belongings or the next occupants.",
      },
      {
        name: "Handover readiness",
        description: "rooms left presentable for keys and inventories.",
      },
    ],
  },
  airbnb_turnover: {
    intro: (
      <>
        Airbnb and short-let cleaning is built for guest-ready turnovers. Browse
        more host options on{" "}
        <FaqLink href="/cleaning/short-lets">short-let cleaning</FaqLink>. A
        typical visit can include:
      </>
    ),
    points: [
      {
        name: "Beds and bathrooms",
        description: "fresh presentation for the next check-in.",
      },
      {
        name: "Kitchen reset",
        description: "surfaces, sink and guest-facing areas cleared.",
      },
      {
        name: "Floors and living spaces",
        description: "hoovering, mopping and a tidy guest-first finish.",
      },
      {
        name: "Bins and touchpoints",
        description: "rubbish out and high-touch areas wiped.",
      },
    ],
  },
  office: {
    intro: (
      <>
        Office cleaning keeps workplaces presentable between busier deep cleans.
        See all{" "}
        <FaqLink href="/cleaning/commercial">commercial cleaning</FaqLink>{" "}
        options. A typical visit can include:
      </>
    ),
    points: [
      {
        name: "Desks and touchpoints",
        description: "wiped surfaces in the rooms you include.",
      },
      {
        name: "Floors and kitchens",
        description: "hoovering, mopping and shared kitchenette care.",
      },
      {
        name: "Washrooms",
        description: "toilets and sinks left hygienic for the working day.",
      },
    ],
  },
};

function includedAfter(service: MarketingService): ReactNode | null {
  if (service.value === "regular") {
    return (
      <p className="mt-3">
        Need a heavier reset later? Book{" "}
        {relatedServiceLink("deep-cleaning", "deep cleaning")} or a{" "}
        {relatedServiceLink("one-off-cleaning", "one-off clean")}. For a full
        walkthrough, read our{" "}
        <FaqLink href="/blog/room-by-room-deep-cleaning-guide">
          room-by-room deep cleaning guide
        </FaqLink>
        .
      </p>
    );
  }
  if (service.value === "deep_clean") {
    return (
      <p className="mt-3">
        Prefer a written plan? Use the{" "}
        <FaqLink href="/blog/room-by-room-deep-cleaning-guide">
          room-by-room deep cleaning guide
        </FaqLink>{" "}
        or the{" "}
        <FaqLink href="/blog/how-to-deep-clean-bathroom">
          bathroom deep clean checklist
        </FaqLink>
        .
      </p>
    );
  }
  return null;
}

function includedFaq(service: MarketingService): CategoryFaq {
  const custom = INCLUDED[service.value];
  if (custom) {
    return faq(
      `What’s included in ${service.label.toLowerCase()}?`,
      <p>{custom.intro}</p>,
      { after: includedAfter(service), points: custom.points },
    );
  }
  return faq(
    `What’s included in ${service.label.toLowerCase()}?`,
    <p>
      {service.description} The checklist is agreed before the visit. Kitchens,
      bathrooms and the rooms you include are the core of the job. Add notes —
      pets, products, rooms to skip — when you{" "}
      <FaqLink href={service.bookingHref}>book online</FaqLink>.
    </p>,
  );
}

function hoursFaq(service: MarketingService): CategoryFaq {
  if (service.category === "commercial") {
    return faq(
      `How long does ${service.label.toLowerCase()} take?`,
      <p>
        Visit length depends on the size of the space, how many rooms or zones
        you include, and whether you add extras.{" "}
        <FaqLink href={service.bookingHref}>Start a booking</FaqLink> to see
        cleaner-time from the details you enter, before you pay.
      </p>,
    );
  }
  if (
    service.value === "deep_clean" ||
    service.value === "end_of_tenancy" ||
    service.category === "moving_home"
  ) {
    return faq(
      `How many hours do I need for ${service.label.toLowerCase()}?`,
      <p>
        These visits usually need more time than a{" "}
        {relatedServiceLink("regular-cleaning", "regular cleaning")} refresh. A
        small flat may take a shorter session; a larger home or a fuller
        checklist needs longer. Choose a duration that matches the property, or
        follow the recommendation when you{" "}
        <FaqLink href={service.bookingHref}>book</FaqLink>.
      </p>,
    );
  }
  if (service.category === "short_term_rental") {
    return faq(
      `How many hours do I need for ${service.label.toLowerCase()}?`,
      <p>
        Turnover time depends on bedrooms, bathrooms and how guest-ready the
        property needs to be. Many hosts book a focused session between
        check-out and check-in; larger places or same-day resets may need
        longer. Set the length in{" "}
        <FaqLink href={service.bookingHref}>booking</FaqLink>.
      </p>,
    );
  }
  return faq(
    `How many hours do I need for ${service.label.toLowerCase()}?`,
    <p>
      The number of hours depends on the size of your home and what you want
      covered. As a guide: 2 to 3 hours suits many small homes or flats; 4 hours
      or more suits larger homes or extras such as ironing; lighter fortnightly
      visits can work when the home is already tidy. See{" "}
      <FaqLink href="/blog/what-can-a-cleaner-do-in-2-hours">
        what a cleaner can do in 2 hours
      </FaqLink>
      , then pick a length in{" "}
      <FaqLink href={service.bookingHref}>booking</FaqLink>, or use the
      recommendation Mundoria shows.
    </p>,
  );
}

function frequencyFaq(service: MarketingService): CategoryFaq | null {
  if (service.value === "regular") {
    return faq(
      "What is the ideal frequency for regular cleaning?",
      <p>
        Choose the rhythm that fits your home. Weekly is the most popular for
        keeping dust and clutter from building up. Every fortnight works well if
        you manage light upkeep between visits. Monthly suits a thorough tidy
        when you can stay on top of day-to-day mess yourself. Set weekly,
        fortnightly or monthly when you{" "}
        <FaqLink href={service.bookingHref}>book regular cleaning</FaqLink>, or
        use a {relatedServiceLink("one-off-cleaning", "one-off clean")} when you
        only need a single date.
      </p>,
    );
  }
  if (service.category === "short_term_rental") {
    return faq(
      "How often should I book short-let cleaning?",
      <p>
        Most hosts book a turnover after every stay. Busy calendars can use a
        repeating schedule; quieter listings may book each clean as a one-off.
        Keep notes and checklists on the booking so each reset stays consistent
        — start from{" "}
        <FaqLink href={service.bookingHref}>short-let booking</FaqLink> or
        browse{" "}
        <FaqLink href="/cleaning/short-lets">short-let services</FaqLink>.
      </p>,
    );
  }
  if (service.category === "commercial") {
    return faq(
      "How often should workplaces book cleaning?",
      <p>
        Many workplaces book weekly or several times a week for daily
        presentation. Others book a deeper clean less often. Pick a one-off
        visit or a repeating schedule when you{" "}
        <FaqLink href={service.bookingHref}>book</FaqLink>, or explore{" "}
        <FaqLink href="/cleaning/commercial">commercial cleaning</FaqLink>.
      </p>,
    );
  }
  if (service.value === "one_off" || service.value === "same_day") {
    return faq(
      "When should I book a one-off clean?",
      <p>
        Book when you need the home ready for a date — guests, a reset after a
        busy period, or a catch-up. Same-day options depend on cleaner
        availability in your area.{" "}
        <FaqLink href={service.bookingHref}>Book a one-off clean</FaqLink>, or
        switch to{" "}
        {relatedServiceLink("regular-cleaning", "regular cleaning")} if you want
        a repeating schedule.
      </p>,
    );
  }
  return null;
}

function costFaq(service: MarketingService): CategoryFaq {
  return faq(
    `How much does ${service.label.toLowerCase()} cost?`,
    <p>
      {service.label} starts from {service.fromPrice}. The estimate updates with
      property size, duration, cleaning standard and any add-ons.{" "}
      <FaqLink href={service.bookingHref}>See your price in booking</FaqLink>{" "}
      before you pay — no surprise extras on the day. More pricing detail is in
      the <FaqLink href={FAQ_LINKS.pricing}>FAQ</FaqLink> and{" "}
      <FaqLink href="/help">Help Centre</FaqLink>.
    </p>,
  );
}

function bookingFaq(service: MarketingService): CategoryFaq {
  return faq(
    `How do I book ${service.label.toLowerCase()} with Mundoria?`,
    <p>
      Ready to book? Open{" "}
      <FaqLink href={service.bookingHref}>Mundoria booking</FaqLink> for{" "}
      {service.label.toLowerCase()}, or browse{" "}
      <FaqLink href={`/cleaners/${LAUNCH_CITY.slug}`}>
        cleaners in {LAUNCH_CITY.name}
      </FaqLink>{" "}
      first. It’s simple:
    </p>,
    {
      points: [
        {
          name: "Open booking",
          description: (
            <>
              choose {service.label.toLowerCase()} from the{" "}
              <FaqLink href={serviceHref(service.slug)}>service page</FaqLink>{" "}
              or go straight to{" "}
              <FaqLink href={service.bookingHref}>booking</FaqLink>.
            </>
          ),
        },
        {
          name: "Add your address",
          description: "so we can match a cleaner who covers your area.",
        },
        {
          name: "Tell us about the space",
          description: "rooms, duration and any extras you need.",
        },
        {
          name: "Pick a time and pay",
          description:
            "securely online, with the estimate clear before you confirm.",
        },
      ],
    },
  );
}

function customizeFaq(service: MarketingService): CategoryFaq {
  const addOnsHref = withBookingParam(service.bookingHref, "step", "addons");
  return faq(
    `Can I customise ${service.label.toLowerCase()}?`,
    <p>
      Yes. Add notes for priority rooms, products to avoid, pets, and access
      details. Optional add-ons such as oven cleaning or ironing appear in{" "}
      <FaqLink href={addOnsHref}>booking extras</FaqLink> when they apply to the
      service. The cleaner sees your notes before the visit.
    </p>,
  );
}

function suppliesFaq(service: MarketingService): CategoryFaq {
  const productsHref = withBookingParam(service.bookingHref, "step", "addons");
  if (service.category === "commercial") {
    return faq(
      "What should be available at the workplace?",
      <p>
        Unless you add{" "}
        <FaqLink href={productsHref}>cleaning products</FaqLink> as an add-on,
        the cleaner expects basic access, power and the rooms unlocked as
        agreed. Share alarm codes, lift access and any out-of-hours notes in the{" "}
        <FaqLink href={service.bookingHref}>booking</FaqLink>.
      </p>,
    );
  }
  return faq(
    "What do I need to provide for the cleaner?",
    <p>
      Unless you add{" "}
      <FaqLink href={productsHref}>cleaning products</FaqLink> as an add-on,
      please leave vacuum, mop, basic supplies and hot water available. Fresh
      bedding should be ready if you want beds remade. For homemade options, see
      our{" "}
      <FaqLink href="/blog/diy-cleaning-sprays-uk-guide">
        DIY cleaning sprays guide
      </FaqLink>
      . Share entry notes, pets and any rooms to skip in the{" "}
      <FaqLink href={service.bookingHref}>booking</FaqLink>. More on access is
      in the <FaqLink href={FAQ_LINKS.accessNotHome}>FAQ</FaqLink> and{" "}
      <FaqLink href="/help">Help Centre</FaqLink>.
    </p>,
  );
}

function whyFaq(service: MarketingService): CategoryFaq {
  return faq(
    `Why book ${service.label.toLowerCase()} with Mundoria?`,
    <p>
      Mundoria is built for a clear booking and a dependable visit.{" "}
      <FaqLink href={service.bookingHref}>
        Book {service.label.toLowerCase()}
      </FaqLink>
      , meet{" "}
      <FaqLink href={`/cleaners/${LAUNCH_CITY.slug}`}>
        vetted cleaners in {LAUNCH_CITY.name}
      </FaqLink>
      , or read more in the <FaqLink href="/faq">FAQ</FaqLink> and{" "}
      <FaqLink href="/help">Help Centre</FaqLink>:
    </p>,
    {
      points: [
        {
          name: "Vetted cleaners",
          description: "matched for the service and your area.",
        },
        {
          name: "Clear pricing",
          description: "see the estimate before you pay.",
        },
        {
          name: "Flexible scheduling",
          description: "one-off or repeating visits where the service allows.",
        },
        {
          name: "Live status",
          description: "follow the booking from confirm to finish.",
        },
        {
          name: "Secure payment",
          description: "pay online through Mundoria.",
        },
      ],
    },
  );
}

/** WeCasa-style FAQ set for a subcategory service page. */
export function serviceDetailFaqs(service: MarketingService): CategoryFaq[] {
  const items = [
    includedFaq(service),
    hoursFaq(service),
    frequencyFaq(service),
    costFaq(service),
    bookingFaq(service),
    customizeFaq(service),
    suppliesFaq(service),
    whyFaq(service),
  ].filter((item): item is CategoryFaq => Boolean(item));

  return items;
}
