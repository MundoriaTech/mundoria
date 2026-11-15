import { LAUNCH_CITY } from "@/lib/seo/marketing";

/** Homepage coverage block, main service / category hubs only. */
export const LAUNCH_CITY_COVERAGE_GROUPS = [
  {
    id: "residential",
    heading: "House cleaning",
    links: [
      {
        href: "/house-cleaning",
        label: `House cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "commercial",
    heading: "Workspace cleaning",
    links: [
      {
        href: "/workspace-cleaning",
        label: `Workspace cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "recovery",
    heading: "Recovery cleaning",
    links: [
      {
        href: "/recovery-cleaning",
        label: `Recovery cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "regular",
    heading: "Regular cleaning",
    links: [
      {
        href: "/house-cleaning/regular",
        label: `Regular Cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "deep",
    heading: "Deep cleaning",
    links: [
      {
        href: "/house-cleaning/deep",
        label: `Deep Cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "end-of-tenancy",
    heading: "End of tenancy cleaning",
    links: [
      {
        href: "/moving-cleaning/end-of-tenancy",
        label: `End of Tenancy Cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "airbnb",
    heading: "Airbnb/Shortlet cleaning",
    links: [
      {
        href: "/airbnb-cleaning/shortlet",
        label: `Airbnb/Shortlet Cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
] as const;
