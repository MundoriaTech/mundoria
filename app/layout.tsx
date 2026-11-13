import type { Metadata } from "next";

import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { FeedbackProvider } from "@/components/shared/feedback-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";
import { PageTransition } from "@/components/shared/page-transition";
import { ScrollToTopOnLoad } from "@/components/shared/scroll-to-top-on-load";
import { sora } from "@/lib/fonts";
import { getGtmId } from "@/lib/analytics/gtm";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/seo/site";

const GTM_ID = getGtmId();

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
      { type: "image/png", sizes: "32x32", url: "/images/brand/favicon-32.png" },
      { type: "image/png", sizes: "512x512", url: "/images/brand/mundoria-mark.png" },
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
    <html className={sora.variable} lang="en-GB" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';var t=localStorage.getItem('mundoria-theme');if(t&&t!=='light'){localStorage.setItem('mundoria-theme','light');}}catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','functionality_storage':'granted','security_storage':'granted','wait_for_update':500});`,
          }}
        />
        {GTM_ID ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        ) : null}
      </head>
      <body className="font-sans antialiased">
        {GTM_ID ? (
          <noscript>
            <iframe
              height="0"
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
              width="0"
            />
          </noscript>
        ) : null}
        <ThemeProvider>
          <FeedbackProvider>
            <AnalyticsProvider>
              <AuthHashHandler />
              <ScrollToTopOnLoad />
              <PageTransition>{children}</PageTransition>
            </AnalyticsProvider>
          </FeedbackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
