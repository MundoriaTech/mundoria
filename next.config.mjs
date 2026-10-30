import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Duplicate service intents → one strong page each
      {
        source: "/cleaning/move-out-cleaning",
        destination: "/cleaning/move-in-move-out-cleaning",
        permanent: true,
      },
      {
        source: "/cleaning/holiday-let-cleaning",
        destination: "/cleaning/airbnb-shortlet-cleaning",
        permanent: true,
      },
      {
        source: "/cleaning/postpartum-cleaning",
        destination: "/cleaning/pregnancy-and-postpartum-cleaning",
        permanent: true,
      },
      {
        source: "/cleaning/injury-recovery-cleaning",
        destination: "/cleaning/illness-and-injury-recovery",
        permanent: true,
      },
      {
        source: "/cleaning/same-day-cleaning",
        destination: "/cleaning/one-off-cleaning",
        permanent: true,
      },
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
      // Standalone towns previously nested under /birmingham/
      {
        source: "/cleaners/birmingham/:town(solihull|shirley|olton|walsall|west-bromwich|halesowen|bromsgrove|smethwick|oldbury|rowley-regis|aldridge|knowle|dorridge|wythall|hollywood|alvechurch|barnt-green|marston-green|chelmsley-wood|castle-bromwich|bearwood|bearwood-sandwell)",
        destination: "/cleaners/:town",
        permanent: true,
      },
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
