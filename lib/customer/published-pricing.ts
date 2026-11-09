import {
  type ServicePricingConfig,
  DEFAULT_SERVICE_PRICING,
  hourlyRateForService,
  productSupplyFromPricing,
  equipmentSupplyFromPricing,
} from "@/lib/customer/pricing-config";
import {
  formatHourlyRate,
  formatMoney,
  indicativeHourlyRatePence,
} from "@/lib/customer/services";
import type { ServiceType } from "@/types/customer";

/** £/h label for a service at the published rate card. */
export function fromRateLabel(
  serviceType: ServiceType,
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
) {
  return formatHourlyRate(indicativeHourlyRatePence(serviceType, pricing));
}

/** Lowest house-cleaning rate for hero “Cleaning from …” copy. */
export function houseCleaningFromLabel(
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
) {
  return fromRateLabel("regular", pricing);
}

export type SupplyRateCopy = {
  equipmentDeep: string;
  equipmentDefault: string;
  productsCommercial: string;
  productsResidential: string;
};

export function supplyRateCopy(
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
): SupplyRateCopy {
  return {
    equipmentDeep: formatHourlyRate(
      equipmentSupplyFromPricing(pricing, "deep_clean"),
    ),
    equipmentDefault: formatHourlyRate(
      equipmentSupplyFromPricing(pricing, "regular"),
    ),
    productsCommercial: formatHourlyRate(
      productSupplyFromPricing(pricing, "commercial"),
    ),
    productsResidential: formatHourlyRate(
      productSupplyFromPricing(pricing, "residential"),
    ),
  };
}

export function cleaningProductsAddOnDescription(
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
) {
  const supply = supplyRateCopy(pricing);
  return `Cleaner brings the Mundoria product kit (${supply.productsResidential} home, ${supply.productsCommercial} workspace).`;
}

export function cleaningEquipmentAddOnDescription(
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
) {
  const supply = supplyRateCopy(pricing);
  return `Cleaner brings the Mundoria equipment kit (${supply.equipmentDefault}, or ${supply.equipmentDeep} for deep cleaning).`;
}

function rate(service: ServiceType, pricing: ServicePricingConfig) {
  return formatMoney(hourlyRateForService(pricing, service));
}

function perHour(service: ServiceType, pricing: ServicePricingConfig) {
  return `${rate(service, pricing)} per hour`;
}

/**
 * Overrides FAQ answers that currently hardcode pound amounts.
 * Keyed by exact question text from the site FAQ catalogue.
 */
export function buildPricingFaqAnswerOverrides(
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
): Record<string, string> {
  const supply = supplyRateCopy(pricing);
  const regular = perHour("regular", pricing);
  const deep = perHour("deep_clean", pricing);
  const oneOff = perHour("one_off", pricing);
  const moveIn = perHour("move_in", pricing);
  const moveOut = perHour("move_out", pricing);
  const eot = perHour("end_of_tenancy", pricing);
  const office = perHour("office", pricing);
  const recovery = perHour("pregnancy_support", pricing);
  const productsHome = formatMoney(
    productSupplyFromPricing(pricing, "residential"),
  );
  const equipmentHome = formatMoney(
    equipmentSupplyFromPricing(pricing, "regular"),
  );

  return {
    "How much does Mundoria cost?":
      `Mundoria pricing depends on the type of cleaning you choose, how much time the job is expected to need and whether you want products or equipment supplied.\n\n` +
      `For home cleaning, our current rates start from:\n\n` +
      `Regular Home Cleaning: ${regular}\n\n` +
      `Deep Cleaning: ${deep}\n\n` +
      `One-Off Cleaning: ${oneOff}\n\n` +
      `Move-In Cleaning: ${moveIn}\n\n` +
      `Move-Out Cleaning: ${moveOut}\n\n` +
      `End of Tenancy Cleaning: ${eot}\n\n` +
      `Recovery Cleaning currently starts from ${recovery}.\n\n` +
      `Workspace services are priced separately because workplaces vary much more in size, layout and cleaning requirements. Office Cleaning currently starts from ${office.replace(" per hour", " per cleaner-hour")}.\n\n` +
      `Any additional cost for products or equipment should be shown before you confirm the booking.\n\n` +
      `The idea is simple: you should be able to understand where the price comes from.`,

    "Do deep cleans cost more than regular cleans?":
      `Yes.\n\nDeep cleaning costs more because it involves more detailed work and usually takes longer.\n\n` +
      `Regular Home Cleaning is currently ${regular}, while Deep Cleaning is ${deep}.\n\n` +
      `Office Cleaning currently starts from ${office.replace(" per hour", " per cleaner-hour")}.\n\n` +
      `The higher rate reflects the additional level of detail and the heavier work that can be involved.`,

    "Are products charged separately?":
      `Yes, where you choose Mundoria to supply them.\n\n` +
      `For Regular Home Cleaning, product supply currently adds ${productsHome} per hour.\n\n` +
      `Workspace bookings use a workspace product supply rate (${supply.productsCommercial}).\n\n` +
      `If you already have suitable products and prefer the cleaner to use them, you can provide your own and avoid the product-supply charge.\n\n` +
      `The relevant cost should always be visible before you book.`,

    "Is equipment charged separately?":
      `Yes, where you choose Mundoria to provide it.\n\n` +
      `For Regular Home Cleaning, equipment supply currently adds ${equipmentHome} per hour.\n\n` +
      `Deep cleaning uses a higher equipment supply rate (${supply.equipmentDeep}).\n\n` +
      `If suitable equipment is already available at the property, you can choose to provide it yourself.`,

    "How much is Regular Home Cleaning?":
      `Regular Home Cleaning is currently ${regular}.\n\n` +
      `If you would like Mundoria to provide cleaning products, that adds ${productsHome} per hour.\n\n` +
      `If you would like standard cleaning equipment supplied, that adds ${equipmentHome} per hour.\n\n` +
      `If you provide your own suitable products and equipment, those additional supply charges do not apply.\n\n` +
      `The final cost depends on how many cleaning hours the home is expected to need.`,

    "How much is Deep Cleaning?":
      `Deep Cleaning is currently ${deep}.\n\n` +
      `Because deep cleaning can require a wider range of products and equipment than regular cleaning, any applicable supply costs should be shown separately when you book.\n\n` +
      `The total price depends on how much time the property is expected to need and the areas you want included.`,

    "How much is One-Off Cleaning?":
      `One-Off Cleaning is currently ${oneOff}.\n\n` +
      `Choose the level of cleaning that fits the property rather than paying for more detail than you need.\n\n` +
      `Any selected products or equipment are charged separately where applicable.`,

    "How much is Move-In Cleaning?":
      `Move-In Cleaning is currently ${moveIn}.\n\n` +
      `The total cost depends on the property size, condition, areas to be cleaned and the number of hours expected.\n\n` +
      `Any product or equipment supply selected as part of the booking is added separately where applicable.`,

    "How much is Move-Out Cleaning?":
      `Move-Out Cleaning is currently ${moveOut}.\n\n` +
      `How much the complete booking costs depends on how large the property is, how much work is required and how many cleaning hours are needed.\n\n` +
      `The clearer the property is of furniture and belongings, the easier it is to make good use of the cleaning time.`,

    "How much is End of Tenancy Cleaning?":
      `End of Tenancy Cleaning is currently ${eot}.\n\n` +
      `Because these bookings often involve more detailed work throughout an empty or nearly empty property, they may require more hours than an ordinary home clean.\n\n` +
      `The total price is therefore based on the expected amount of cleaning time rather than one fixed price for every tenancy.`,

    "How much is Office Cleaning?":
      `Office Cleaning currently starts from ${office.replace(" per hour", " per cleaner-hour")}.\n\n` +
      `The actual cost depends on the size of the workplace, the number and type of areas being cleaned, how frequently the service is needed and whether products or equipment are being supplied.\n\n` +
      `For larger sites, Mundoria may quote the total expected cleaner-hours rather than expecting you to calculate the job yourself.`,

    "How much is Recovery Cleaning?":
      `Recovery Cleaning currently starts from ${recovery}.\n\n` +
      `That applies across Mundoria Recovery services such as Pregnancy & Postpartum Home Cleaning, Illness & Injury Recovery Home Cleaning, Hospital Discharge Home Cleaning and Bereavement Home Cleaning.\n\n` +
      `The slightly different rate reflects the way these bookings are handled around individual circumstances and preferences.\n\n` +
      `The service remains cleaning only. There are no medical, nursing or personal-care services included in the price.`,

    "How much does product supply cost?":
      `For Regular Home Cleaning, Mundoria currently charges an additional ${productsHome} per hour where cleaning products are supplied.\n\n` +
      `Workspace product supply is currently ${supply.productsCommercial}.\n\n` +
      `The price shown during booking should reflect the service you have selected.`,

    "How much does equipment supply cost?":
      `For Regular Home Cleaning, Mundoria currently charges an additional ${equipmentHome} per hour where equipment is supplied.\n\n` +
      `Deep cleaning equipment supply is currently ${supply.equipmentDeep}.\n\n` +
      `If you choose to have Mundoria supply both products and equipment, both charges should be shown clearly before you confirm the booking.`,
  };
}

export function applyPricingFaqOverrides<T extends { answer: string; question: string }>(
  items: T[],
  pricing: ServicePricingConfig = DEFAULT_SERVICE_PRICING,
): T[] {
  const overrides = buildPricingFaqAnswerOverrides(pricing);
  return items.map((item) => {
    const next = overrides[item.question];
    return next ? { ...item, answer: next } : item;
  });
}
