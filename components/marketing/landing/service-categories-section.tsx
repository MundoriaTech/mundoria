"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { marketingServiceBySlug } from "@/lib/seo/marketing";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    id: "home",
    image: "/images/marketing/landing/category-home-glove.png",
    imageAlt: "A yellow glove holding a pink cleaning cloth",
    imageClassName: "object-[center_42%] lg:object-[center_38%]",
    intro: "Scheduled upkeep, a one-off visit, a move, or a home ready for guests.",
    label: "Residential",
    items: [
      {
        description: "Everyday upkeep, on a schedule that works for you.",
        href: "/cleaning/regular-cleaning",
        label: "Regular cleaning",
      },
      {
        description: "A helping hand when your home needs a reset.",
        href: "/cleaning/one-off-cleaning",
        label: "One-off cleaning",
      },
      {
        description: "Ready to leave, or ready to arrive.",
        href: "/cleaning/move-in-move-out-cleaning",
        label: "Move-in / move-out",
      },
      {
        description: "A checkout clean for landlord and agent standards.",
        href: "/cleaning/end-of-tenancy-cleaning",
        label: "End of tenancy",
      },
      {
        description: "A turnover so the place is guest-ready.",
        href: "/cleaning/airbnb-shortlet-cleaning",
        label: "Airbnb/Shortlet",
      },
    ],
  },
  {
    id: "workplace",
    image: "/images/marketing/landing/commercial-category.png",
    imageAlt: "A bright workplace ready for a clean",
    imageClassName: "object-center",
    intro: "Desks, shop floors, classrooms and the shared spaces between them.",
    label: "Commercial",
    items: [
      {
        description: "Desks, toilets and shared rooms.",
        href: "/cleaning/office-cleaning",
        label: "Office cleaning",
      },
      {
        description: "Shops, cafés and guest areas.",
        href: "/cleaning/retail-and-hospitality-cleaning",
        label: "Retail and hospitality",
      },
      {
        description: "Schools and learning spaces.",
        href: "/cleaning/educational-facility-cleaning",
        label: "Education",
      },
      {
        description: "Halls, stairs and shared blocks.",
        href: "/cleaning/communal-area-cleaning",
        label: "Communal areas",
      },
    ],
  },
  {
    id: "recovery",
    image: "/images/booking/categories/recovery.jpg",
    imageAlt: "A family holding a baby against a pink wall",
    imageClassName: "object-center",
    intro: "Practical cleaning support when life at home changes.",
    label: "Recovery",
    items: [
      {
        description: "Extra help around the house.",
        href: "/cleaning/pregnancy-and-postpartum-cleaning",
        label: "Pregnancy and postpartum",
      },
      {
        description: "Support while you recover.",
        href: "/cleaning/illness-and-injury-recovery",
        label: "Illness and injury",
      },
      {
        description: "A home ready for coming back.",
        href: "/cleaning/hospital-discharge-home-cleaning",
        label: "Hospital discharge",
      },
      {
        description: "Practical help at a hard time.",
        href: "/cleaning/bereavement-support-cleaning",
        label: "Bereavement support",
      },
    ],
  },
] as const;

export function ServiceCategoriesSection({
  bookingHref,
}: {
  bookingHref: string;
}) {
  const [activeId, setActiveId] = useState<(typeof GROUPS)[number]["id"]>("home");
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const active = GROUPS.find((group) => group.id === activeId) ?? GROUPS[0];
  const setupOnly = bookingHref === "/setup";

  function selectGroup(id: (typeof GROUPS)[number]["id"]) {
    setActiveId(id);
    setOpenLabel(null);
  }

  return (
    <section
      className="relative z-10 -mt-6 px-3 pb-2 sm:-mt-10 sm:px-8 sm:pb-4 lg:-mt-2"
      id="services"
    >
      <div className="mx-auto max-w-6xl rounded-[1.35rem] bg-[#f6f1e7] px-4 py-5 shadow-[0_24px_60px_rgba(28,19,59,0.18)] sm:rounded-[2rem] sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <h2 className="text-balance text-[1.45rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
          A clean for every kind of day.
        </h2>

        <div
          className="mt-5 grid grid-cols-3 border-b border-[#e6d8c8] sm:mt-8"
          role="tablist"
          aria-label="Cleaning categories"
        >
          {GROUPS.map((group) => {
            const selected = group.id === active.id;
            return (
              <button
                aria-selected={selected}
                className={cn(
                  "relative flex min-h-11 items-end justify-center px-1 pb-3 text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] transition min-[380px]:text-[11px] sm:text-[12px] sm:tracking-[0.14em]",
                  selected ? "text-[#1c133b]" : "text-[#b7a48a] hover:text-[#1c133b]",
                )}
                key={group.id}
                onClick={() => selectGroup(group.id)}
                role="tab"
                type="button"
              >
                <span className="relative">
                  {group.label}
                  {selected ? (
                    <span className="absolute -bottom-3 left-0 right-0 h-[3px] rounded-full bg-[#312c79]" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid items-start gap-5 sm:mt-8 sm:gap-8 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-12">
          <div
            className={cn(
              "relative overflow-hidden rounded-[1rem] bg-[#efe6d8] lg:rounded-[1.15rem]",
              active.id === "home"
                ? "mx-auto aspect-[4/5] w-full max-w-[17.5rem] md:mx-0 md:max-w-none md:aspect-[3/4] lg:aspect-[4/5]"
                : "aspect-[4/3] md:aspect-[5/4] lg:aspect-square",
            )}
          >
            <Image
              alt={active.imageAlt}
              className={cn("object-cover", active.imageClassName)}
              fill
              key={active.id}
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 280px"
              src={active.image}
            />
          </div>

          <div>
            <p className="max-w-md text-sm leading-6 text-[#3d3a48] sm:text-[15px]">
              {active.intro}
            </p>
            <ul className="mt-4 divide-y divide-[#eadfce] border-b border-[#eadfce] sm:mt-6">
              {active.items.map((item) => {
                const open = openLabel === item.label;
                const slug = item.href.replace(/^\/cleaning\//, "").split("/")[0] ?? "";
                const service = marketingServiceBySlug(slug);
                const bookHref =
                  setupOnly || !service ? bookingHref : service.bookingHref;
                const panelId = `category-actions-${slug}`;
                return (
                  <li key={item.label}>
                    <button
                      aria-controls={panelId}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 py-3.5 text-left sm:gap-4 sm:py-4"
                      onClick={() =>
                        setOpenLabel((current) =>
                          current === item.label ? null : item.label,
                        )
                      }
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block text-[16px] font-semibold tracking-[-0.02em] text-[#2a2158] sm:text-[17px]">
                          {item.label}
                        </span>
                        <span className="mt-1 block max-w-sm text-sm leading-5 text-[#5c5670]">
                          {item.description}
                        </span>
                      </span>
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "h-4 w-4 shrink-0 text-[#2a2158] transition",
                          open && "rotate-180",
                        )}
                        strokeWidth={1.75}
                      />
                    </button>
                    {open ? (
                      <div className="flex flex-wrap gap-2 pb-4" id={panelId}>
                        <Link
                          className="inline-flex h-9 items-center justify-center rounded-full border border-[#2a2158] px-4 text-[13px] font-semibold text-[#2a2158] transition hover:bg-[#2a2158] hover:text-white"
                          href={item.href}
                        >
                          Read more
                        </Link>
                        <Link
                          className="inline-flex h-9 items-center justify-center rounded-full bg-[#2a2158] px-4 text-[13px] font-semibold text-white transition hover:bg-[#3d3470]"
                          href={bookHref}
                        >
                          Book now
                        </Link>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
