import { z } from "zod";

export const signupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long")
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || value.length >= 7, {
      message: "Enter a valid phone number",
    }),
  role: z.enum(["customer", "cleaner"]),
  gender: z.enum(["woman", "man"]).optional(),
  referral_code: z.string().trim().max(40).optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.role !== "cleaner") return;
  const phone = (value.phone ?? "").trim();
  if (phone.length < 7) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid phone number",
      path: ["phone"],
    });
  }
  if (value.gender !== "woman" && value.gender !== "man") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose woman or man",
      path: ["gender"],
    });
  }
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const completeProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(30, "Phone number is too long"),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupValues = z.infer<typeof signupSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type CompleteProfileValues = z.infer<typeof completeProfileSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
