import { z } from "zod";

/** New passwords: length, plus one capital letter, one number, and one symbol. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .refine((value) => /[A-Z]/.test(value), {
    message: "Password must include a capital letter",
  })
  .refine((value) => /\d/.test(value), {
    message: "Password must include a number",
  })
  .refine((value) => /[^A-Za-z0-9]/.test(value), {
    message: "Password must include a symbol",
  });

export const signupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address"),
  password: passwordSchema,
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
    password: passwordSchema,
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
