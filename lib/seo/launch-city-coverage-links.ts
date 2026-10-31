import { LAUNCH_CITY } from "@/lib/seo/marketing";

/** Homepage coverage block, main service / category hubs only. */
export const LAUNCH_CITY_COVERAGE_GROUPS = [
  {
    id: "residential",
    heading: "Residential cleaning",
    links: [
      {
        href: "/cleaning/residential",
        label: `Residential cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "commercial",
    heading: "Workspace cleaning",
    links: [
      {
        href: "/cleaning/commercial",
        label: `Workspace cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "recovery",
    heading: "Recovery cleaning",
    links: [
      {
        href: "/cleaning/recovery",
        label: `Recovery cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "regular",
    heading: "Regular cleaning",
    links: [
      {
        href: "/cleaning/regular-cleaning",
        label: `Regular Cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "deep",
    heading: "Deep cleaning",
    links: [
      {
        href: "/cleaning/deep-cleaning",
        label: `Deep Cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "end-of-tenancy",
    heading: "End of tenancy cleaning",
    links: [
      {
        href: "/cleaning/end-of-tenancy-cleaning",
        label: `End of Tenancy Cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
  {
    id: "airbnb",
    heading: "Airbnb/Shortlet cleaning",
    links: [
      {
        href: "/cleaning/airbnb-shortlet-cleaning",
        label: `Airbnb/Shortlet Cleaning in ${LAUNCH_CITY.name}`,
      },
    ],
  },
] as const;
