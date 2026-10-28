import Link from "next/link";

import { placeServiceExplainerItems } from "@/lib/seo/place-service-explainer";

const linkClass =
  "font-semibold text-brand-purple underline-offset-2 hover:underline";

export function PlaceServiceExplainerList({ place }: { place: string }) {
  const items = placeServiceExplainerItems(place);

  return (
    <ul className="mt-3 list-disc space-y-2.5 pl-5">
      {items.map((item) => (
        <li key={item.href} className="text-sm leading-6 text-[#414141] sm:text-[15px] sm:leading-7">
          <Link className={linkClass} href={item.href}>
            {item.label}
          </Link>
          {" — "}
          {item.explanation}
        </li>
      ))}
    </ul>
  );
}

export function PlaceServiceExplainerIntro({ place }: { place: string }) {
  return (
    <>
      Mundoria connects you with independent cleaners for homes, guest turns,
      workplaces and Recovery support across {place}. Each service has a dedicated{" "}
      {place} page with clear from-prices and online booking:
    </>
  );
}
