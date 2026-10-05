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
      description: `${service.label} in Birmingham starts from ${service.fromPrice}. The estimate changes with property size, standard and add-ons.`,
      paragraphs: [
        `${service.label} in Birmingham starts from ${service.fromPrice}. That figure is the opening estimate, before bedrooms, bathrooms, condition and any extras are added.`,
        "Mundoria shows the price in the booking flow before you pay. A larger home, a higher cleaning standard, or add-ons such as an oven or inside the fridge change the total.",
        "You can compare the same service in Harborne, Edgbaston, Moseley and the other Birmingham neighbourhoods we cover. The starting price is the same; the visit is sized to the property.",
      ],
      title: `How much does ${service.label.toLowerCase()} cost in Birmingham?`,
    };
  }

  if (topic === "included") {
    return {
      description: `What a ${service.label.toLowerCase()} visit in Birmingham includes, and what stays outside the standard checklist.`,
      paragraphs: [
        service.description,
        "The checklist is agreed before the visit. Kitchens, bathrooms and the rooms you include are the core of the job. Notes you add — pets, products, rooms to skip — stay on the booking.",
        "Specialist extras, such as an oven clean or inside windows, are add-ons when the service offers them. They are priced in the estimate rather than added on the day.",
      ],
      title: `What is included in ${service.label.toLowerCase()} in Birmingham?`,
    };
  }

  return {
    description: `How to book ${service.label.toLowerCase()} in Birmingham, from postcode to a confirmed cleaner.`,
    paragraphs: [
      `Book ${service.label.toLowerCase()} in Birmingham from the service page. Enter the postcode, choose the property size and cleaning standard, then pick a time.`,
      "Mundoria matches an active cleaner who covers that district and offers this service. You see status updates through arrival and completion, and you can message from the booking.",
      "Neighbourhood pages list cleaners who already cover Jewellery Quarter, Edgbaston, Harborne, Moseley, Kings Heath and Selly Oak, including the postcode districts we actually serve.",
    ],
    title: `How to book ${service.label.toLowerCase()} in Birmingham`,
  };
}
