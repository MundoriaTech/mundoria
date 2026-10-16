import Link from "next/link";

const pillClass =
  "inline-flex rounded-full border border-[#e4daf5] bg-white px-4 py-2 text-sm font-semibold text-[#1c133b] transition hover:text-[#6a45b8]";

export function CoveragePlacePills({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <ul className="mt-4 flex flex-wrap gap-3">
      {links.map((item) => (
        <li key={`${item.href}-${item.label}`}>
          <Link className={pillClass} href={item.href}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
