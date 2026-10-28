import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Parent list for nested customer / cleaner dashboard routes. */
export function appParentBackLink(
  pathname: string,
): { href: string; label: string } | null {
  const bookingReceipt = pathname.match(/^\/booking\/([^/]+)\/receipt\/?$/);
  if (bookingReceipt) {
    return { href: `/booking/${bookingReceipt[1]}`, label: "Booking" };
  }
  if (/^\/booking\/[^/]+\/?$/.test(pathname)) {
    return { href: "/bookings", label: "Sessions" };
  }
  if (/^\/messages\/[^/]+\/?$/.test(pathname)) {
    return { href: "/messages", label: "Messages" };
  }
  if (pathname === "/addresses" || pathname === "/payments") {
    return { href: "/profile", label: "Account" };
  }
  if (/^\/cleaner\/job\/[^/]+\/?$/.test(pathname)) {
    return { href: "/cleaner/jobs", label: "Jobs" };
  }
  if (/^\/cleaner\/messages\/[^/]+\/?$/.test(pathname)) {
    return { href: "/cleaner/messages", label: "Messages" };
  }
  if (pathname === "/cleaner/performance") {
    return { href: "/cleaner/dashboard", label: "Dashboard" };
  }
  return null;
}

export function DashboardBackLink({
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
        "inline-flex min-h-10 items-center gap-0.5 text-sm font-medium text-brand-muted transition hover:text-brand-ink",
        className,
      )}
      href={href}
    >
      <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
      Back to {label}
    </Link>
  );
}
