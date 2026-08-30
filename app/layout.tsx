import type { Metadata } from "next";

import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import {
  GoogleTagManagerHead,
  GoogleTagManagerNoscript,
} from "@/components/analytics/gtm-scripts";
import { FeedbackProvider } from "@/components/shared/feedback-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} UK | Trusted cleaning, beautifully managed`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { type: "image/x-icon", url: "/favicon.ico" },
      { type: "image/png", url: "/images/brand/favicon-32.png" },
      { type: "image/png", url: "/images/brand/cleanscape-mark.png" },
    ],
  },
  openGraph: {
    description: SITE_TAGLINE,
    images: [{ alt: SITE_NAME, url: absoluteUrl(DEFAULT_OG_IMAGE) }],
    locale: "en_GB",
    siteName: SITE_NAME,
    type: "website",
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    description: SITE_TAGLINE,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
    title: SITE_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cleanscape-theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','functionality_storage':'granted','security_storage':'granted','wait_for_update':500});`,
          }}
        />
        <GoogleTagManagerHead />
      </head>
      <body className="font-sans">
        <GoogleTagManagerNoscript />
        <ThemeProvider>
          <FeedbackProvider>
            <AnalyticsProvider>
              <AuthHashHandler />
              {children}
            </AnalyticsProvider>
          </FeedbackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
