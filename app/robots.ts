import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    host: absoluteUrl("/"),
    rules: [
      {
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/bookings",
          "/bookings/",
          "/booking/",
          "/messages",
          "/messages/",
          "/payments",
          "/payments/",
          "/profile",
          "/addresses",
          "/cleaner",
          "/cleaner/",
          "/setup",
          "/complete-profile",
          "/update-password",
          "/forgot-password",
          "/admin-invite",
        ],
        userAgent: "*",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
