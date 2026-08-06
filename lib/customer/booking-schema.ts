import { z } from "zod";

const serviceType = z.enum([
  "regular",
  "one_off",
  "deep_clean",
  "end_of_tenancy",
  "move_in",
  "move_out",
  "airbnb_turnover",
  "holiday_let",
  "serviced_accommodation",
  "office",
  "retail_hospitality",
  "educational_facility",
  "communal_area",
  "window_cleaning",
  "pregnancy_support",
  "postpartum",
  "illness_recovery",
  "post_injury",
  "hospital_discharge",
  "bereavement_support",
]);

const serviceCategory = z.enum([
  "residential",
  "commercial",
  "short_term_rental",
  "exterior",
  "recovery",
]);

const cleaningStandard = z.enum(["essential", "enhanced", "comprehensive"]);

export const bookingDraftSchema = z.object({
  addressId: z.string().uuid(),
  cleaningStandard,
  isRecurring: z.boolean(),
  preferSameCleaner: z.boolean(),
  promoCode: z.string().trim().max(40),
  propertyCondition: z
    .enum(["maintained", "extra_attention", "neglected"])
    .nullable()
    .default(null),
  recurrencePattern: z
    .enum(["weekly", "fortnightly", "monthly"])
    .nullable(),
  recommendationOutcome: z
    .enum(["not_shown", "accepted", "overridden", "auto_applied"])
    .default("not_shown"),
  recommendedCleaningStandard: cleaningStandard.nullable().default(null),
  recommendedServiceType: serviceType.nullable().default(null),
  recentlyMoved: z.boolean().nullable().default(null),
  scheduledDate: z.string().date(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  selectedAddOns: z.array(z.string().trim().min(1)).default([]),
  serviceCategory,
  serviceType,
  specialAttentionAreas: z.array(z.string().trim().min(1)).default([]),
  specialInstructions: z.string().trim().max(2000),
});

export const createBookingSchema = bookingDraftSchema.extend({
  paymentIntentId: z.string().min(1),
});
