import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyCleanerEmailSignupOtp } from "@/lib/auth/cleaner-signup-flow";
import { resolveAppUrl } from "@/lib/auth/send-auth-link-email";

const bodySchema = z.object({
  code: z.string().trim().min(4).max(12),
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const result = await verifyCleanerEmailSignupOtp({
      appUrl: resolveAppUrl(request),
      code: parsed.data.code,
      email: parsed.data.email,
      request,
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      email: result.email,
      hasSession: false,
      next: result.nextPath,
      requiresEmailConfirmation: false,
      role: result.role,
      success: true,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Unable to verify that code. Try again shortly." },
      { status: 500 },
    );
  }
}
