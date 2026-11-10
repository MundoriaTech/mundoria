import { withSentryConfig } from "@sentry/nextjs";

/**
 * Retired service slugs → their canonical page.
 * Keep in sync with SEO_SERVICE_REDIRECTS in lib/seo/canonical.ts.
 */
const RETIRED_SERVICE_SLUGS = {
  "move-out-cleaning": "move-in-move-out-cleaning",
  "holiday-let-cleaning": "airbnb-shortlet-cleaning",
  "postpartum-cleaning": "pregnancy-and-postpartum-cleaning",
  "injury-recovery-cleaning": "illness-and-injury-recovery",
  "same-day-cleaning": "one-off-cleaning",
};

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Every retired URL resolves to its live page in ONE hop (audit, Nov 2026).
    const retiredServiceVariants = Object.entries(RETIRED_SERVICE_SLUGS).flatMap(
      ([from, to]) => [
        { source: `/cleaning/${from}`, destination: `/cleaning/${to}`, permanent: true },
        { source: `/cleaning/${from}/birmingham`, destination: `/cleaning/${to}`, permanent: true },
        {
          source: `/cleaning/${from}/birmingham/wider/:zone`,
          destination: `/cleaning/${to}`,
          permanent: true,
        },
        {
          source: `/cleaning/${from}/guides/:topic(price|included|booking)`,
          destination: `/cleaning/${to}/guides/:topic`,
          permanent: true,
        },
      ],
    );
    return [
      // Duplicate service intents → one strong page each (incl. their old sub-URLs)
      ...retiredServiceVariants,
      // Wider-area hubs overlapped local place pages
      {
        source: "/cleaners/birmingham/wider/:zone",
        destination: "/cleaners/birmingham",
        permanent: true,
      },
      {
        source: "/cleaning/:slug/birmingham/wider/:zone",
        destination: "/cleaning/:slug",
        permanent: true,
      },
      {
        source: "/cleaning/:slug/birmingham",
        destination: "/cleaning/:slug",
        permanent: true,
      },
      // Old Erdington hub slug (was a redirect target that 404ed)
      {
        source: "/cleaners/birmingham/erdington-and-north-east-birmingham",
        destination: "/cleaners/birmingham/erdington",
        permanent: true,
      },
      // The city hub is /cleaners/birmingham, never a "birmingham" place under it
      {
        source: "/cleaners/birmingham/birmingham",
        destination: "/cleaners/birmingham",
        permanent: true,
      },
      // Standalone towns previously nested under /birmingham/
      {
        source: "/cleaners/birmingham/:town(solihull|shirley|olton|walsall|west-bromwich|halesowen|cradley-heath|coleshill|water-orton|bromsgrove|smethwick|oldbury|rowley-regis|aldridge|knowle|dorridge|wythall|hollywood|alvechurch|barnt-green|marston-green|chelmsley-wood|castle-bromwich|bearwood)",
        destination: "/cleaners/:town",
        permanent: true,
      },
      // Obvious URLs people and AI agents try
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/reviews", destination: "/#reviews", permanent: false },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        hostname: "images.pexels.com",
        protocol: "https",
      },
    ],
  },
  experimental: {
    instrumentationHook: true,
  },
  // Avoid corrupted PackFileCacheStrategy ("invalid block type") on this machine.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
