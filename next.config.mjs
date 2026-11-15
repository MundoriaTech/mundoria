import { withSentryConfig } from "@sentry/nextjs";

/**
 * Legacy `/cleaning/{slug}` → new public path (no `/cleaning` prefix).
 * Keep in sync with LEGACY_CLEANING_PATHS in lib/seo/public-paths.ts.
 */
const LEGACY_CLEANING_PATHS = {
  residential: "/house-cleaning",
  commercial: "/workspace-cleaning",
  "short-lets": "/airbnb-cleaning",
  "moving-home": "/moving-cleaning",
  recovery: "/recovery-cleaning",
  "regular-cleaning": "/house-cleaning/regular",
  "one-off-cleaning": "/house-cleaning/one-off",
  "deep-cleaning": "/house-cleaning/deep",
  "same-day-cleaning": "/house-cleaning/one-off",
  "move-in-move-out-cleaning": "/moving-cleaning/move-in-move-out",
  "move-out-cleaning": "/moving-cleaning/move-in-move-out",
  "end-of-tenancy-cleaning": "/moving-cleaning/end-of-tenancy",
  "airbnb-shortlet-cleaning": "/airbnb-cleaning/shortlet",
  "holiday-let-cleaning": "/airbnb-cleaning/shortlet",
  "serviced-accommodation-cleaning": "/airbnb-cleaning/serviced",
  "office-cleaning": "/workspace-cleaning/office",
  "retail-and-hospitality-cleaning":
    "/workspace-cleaning/retail-and-hospitality",
  "educational-facility-cleaning": "/workspace-cleaning/education",
  "communal-area-cleaning": "/workspace-cleaning/communal-areas",
  "pregnancy-and-postpartum-cleaning":
    "/recovery-cleaning/pregnancy-and-postpartum",
  "postpartum-cleaning": "/recovery-cleaning/pregnancy-and-postpartum",
  "hospital-discharge-home-cleaning": "/recovery-cleaning/hospital-discharge",
  "bereavement-support-cleaning": "/recovery-cleaning/bereavement-support",
  "illness-and-injury-recovery": "/recovery-cleaning",
  "injury-recovery-cleaning": "/recovery-cleaning",
};

const STANDALONE_TOWNS =
  "solihull|shirley|olton|walsall|west-bromwich|halesowen|cradley-heath|coleshill|water-orton|bromsgrove|smethwick|oldbury|rowley-regis|aldridge|knowle|dorridge|wythall|worcester|alvechurch|barnt-green|marston-green|chelmsley-wood|castle-bromwich|bearwood";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    const legacyCleaningVariants = Object.entries(LEGACY_CLEANING_PATHS).flatMap(
      ([from, to]) => [
        { source: `/cleaning/${from}`, destination: to, permanent: true },
        {
          source: `/cleaning/${from}/birmingham`,
          destination: `${to}/birmingham`,
          permanent: true,
        },
        {
          source: `/cleaning/${from}/birmingham/:area`,
          destination: `${to}/birmingham/:area`,
          permanent: true,
        },
        {
          source: `/cleaning/${from}/birmingham/wider/:zone`,
          destination: `${to}/birmingham`,
          permanent: true,
        },
        {
          source: `/cleaning/${from}/guides/:topic(price|included|booking)`,
          destination: to,
          permanent: true,
        },
      ],
    );

    return [
      ...legacyCleaningVariants,
      // Catch-all for any remaining /cleaning/{slug}/… not listed above
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
      // City hub is the category root — no /house-cleaning/birmingham twin
      {
        source: "/house-cleaning/birmingham",
        destination: "/house-cleaning",
        permanent: true,
      },
      // City Centre is not a separate location — fold into Birmingham hub
      {
        source: "/house-cleaning/birmingham/birmingham-city-centre",
        destination: "/house-cleaning",
        permanent: true,
      },
      {
        source: "/house-cleaning/birmingham/city-centre",
        destination: "/house-cleaning",
        permanent: true,
      },
      {
        source: "/:category(workspace-cleaning|moving-cleaning|airbnb-cleaning|recovery-cleaning)/birmingham/birmingham-city-centre",
        destination: "/:category/birmingham",
        permanent: true,
      },
      {
        source: "/:category(workspace-cleaning|moving-cleaning|airbnb-cleaning|recovery-cleaning)/birmingham/city-centre",
        destination: "/:category/birmingham",
        permanent: true,
      },
      {
        source: "/cleaners/birmingham/birmingham-city-centre",
        destination: "/house-cleaning",
        permanent: true,
      },
      {
        source: "/cleaners/birmingham/city-centre",
        destination: "/house-cleaning",
        permanent: true,
      },
      // House cleaners Birmingham hub → house cleaning
      {
        source: "/cleaners/birmingham",
        destination: "/house-cleaning",
        permanent: true,
      },
      {
        source: "/cleaners/birmingham/wider/:zone",
        destination: "/house-cleaning",
        permanent: true,
      },
      {
        source: "/cleaners/birmingham/birmingham",
        destination: "/house-cleaning",
        permanent: true,
      },
      {
        source: "/cleaners/birmingham/erdington-and-north-east-birmingham",
        destination: "/house-cleaning/birmingham/erdington",
        permanent: true,
      },
      // Standalone towns previously under /cleaners/birmingham/ or /cleaners/
      {
        source: `/cleaners/birmingham/:town(${STANDALONE_TOWNS})`,
        destination: "/house-cleaning/:town",
        permanent: true,
      },
      {
        source: `/cleaners/:town(${STANDALONE_TOWNS})`,
        destination: "/house-cleaning/:town",
        permanent: true,
      },
      // Birmingham neighbourhood hubs (not profiles — :area is one segment)
      {
        source: "/cleaners/birmingham/:area",
        destination: "/house-cleaning/birmingham/:area",
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
  // Trim the browser SDK (it ships on every page). Session Replay is not used,
  // and debug output is off in sentry.client.config.ts.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
});
