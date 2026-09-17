import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { claimTeamSlot } from "@/lib/matching/team";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await claimTeamSlot({
      bookingId: params.id,
      cleanerId: user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not claim team slot",
      },
      { status: 409 },
    );
  }
}
