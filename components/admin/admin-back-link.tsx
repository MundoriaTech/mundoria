import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Parent list for nested admin detail routes. */
export function adminParentBackLink(
  pathname: string,
): { href: string; label: string } | null {
  if (/^\/admin\/cleaners\/[^/]+\/?$/.test(pathname)) {
    return { href: "/admin/cleaners", label: "Cleaners" };
  }
  if (/^\/admin\/customer\/[^/]+\/?$/.test(pathname)) {
    return { href: "/admin/customers", label: "Customers" };
  }
  if (/^\/admin\/booking\/[^/]+\/?$/.test(pathname)) {
    return { href: "/admin/bookings", label: "Bookings" };
  }
  if (/^\/admin\/disputes\/[^/]+\/?$/.test(pathname)) {
    return { href: "/admin/disputes", label: "Disputes" };
  }
  if (
    pathname === "/admin/mag/new" ||
    /^\/admin\/mag\/[^/]+\/?$/.test(pathname)
  ) {
    return { href: "/admin/mag", label: "Mundoria Mag" };
  }
  return null;
}

export function AdminBackLink({
  className,
  href,
  label,
}: {
  className?: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-10 items-center gap-0.5 text-sm font-medium text-[#5a5470] transition hover:text-[#1c133b]",
        className,
      )}
      href={href}
    >
      <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
      Back to {label}
    </Link>
  );
}
