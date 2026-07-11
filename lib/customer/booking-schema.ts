import { z } from "zod";

const serviceType = z.enum([
  "regular",
  "one_off",
  "deep_clean",
  "end_of_tenancy",
  "airbnb_turnover",
  "post_construction",
]);

export const bookingDraftSchema = z.object({
  addressId: z.string().uuid(),
  isRecurring: z.boolean(),
  preferSameCleaner: z.boolean(),
  promoCode: z.string().trim().max(40),
  recurrencePattern: z
    .enum(["weekly", "fortnightly", "monthly"])
    .nullable(),
  scheduledDate: z.string().date(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  serviceType,
  specialInstructions: z.string().trim().max(2000),
});

export const createBookingSchema = bookingDraftSchema.extend({
  paymentIntentId: z.string().min(1),
});
