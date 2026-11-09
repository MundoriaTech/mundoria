import type { MarketingService } from "@/lib/seo/marketing";

export const SERVICE_GUIDE_TOPICS = ["price", "included", "booking"] as const;

export type ServiceGuideTopic = (typeof SERVICE_GUIDE_TOPICS)[number];

export function isServiceGuideTopic(value: string): value is ServiceGuideTopic {
  return (SERVICE_GUIDE_TOPICS as readonly string[]).includes(value);
}

export function serviceGuidePath(serviceSlug: string, topic: ServiceGuideTopic) {
  return `/cleaning/${serviceSlug}/guides/${topic}`;
}

export function serviceGuide(service: MarketingService, topic: ServiceGuideTopic) {
  if (topic === "price") {
    return {
      description: `${service.label} in Birmingham starts from ${service.fromPrice}. The total changes with property size, timing and add-ons.`,
      paragraphs: [
        `${service.label} in Birmingham starts from ${service.fromPrice}. That figure is the opening estimate, before bedrooms, bathrooms, condition and any extras are added.`,
        "Mundoria shows the price in the booking flow before you pay. A larger home, early, evening or weekend timing, or add-ons such as cleaning products change the total.",
        "You can compare the same service in Harborne, Edgbaston, Moseley and the other Birmingham neighbourhoods we cover. The starting price is the same; the visit is sized to the property.",
      ],
      metaTitle: `${service.label} Prices in Birmingham`,
      title: `How much does ${service.label.toLowerCase()} cost in Birmingham?`,
    };
  }

  if (topic === "included") {
    return {
      description: `What a ${service.label.toLowerCase()} visit in Birmingham includes, what stays outside the standard checklist, and which extras you can add before you book.`,
      paragraphs: [
        service.description,
        "The checklist is agreed before the visit. Kitchens, bathrooms and the rooms you include are the core of the job. Notes you add, pets, products, rooms to skip, stay on the booking.",
        "Specialist extras, such as an oven clean or inside windows, are add-ons when the service offers them. They are priced in the estimate rather than added on the day.",
      ],
      metaTitle: `What ${service.label} Includes`,
      title: `What is included in ${service.label.toLowerCase()} in Birmingham?`,
    };
  }

  return {
    description: `How to book ${service.label.toLowerCase()} in Birmingham from ${service.fromPrice}: enter your postcode, see the price, pick a time and follow your cleaner live.`,
    paragraphs: [
      `Book ${service.label.toLowerCase()} in Birmingham from the service page. Enter the postcode, tell us the property size, see the price, then pick a time.`,
      "Mundoria matches an active cleaner who covers that district and offers this service. You see status updates through arrival and completion, and you can message from the booking.",
      "Neighbourhood pages list cleaners who already cover Jewellery Quarter, Edgbaston, Harborne, Moseley, Kings Heath and Selly Oak, including the postcode districts we actually serve.",
    ],
    metaTitle: `How to Book ${service.label} in Birmingham`,
    title: `How to book ${service.label.toLowerCase()} in Birmingham`,
  };
}
