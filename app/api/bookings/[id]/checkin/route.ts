import { handleGeofenceRequest } from "@/lib/bookings/geofence-route";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  return handleGeofenceRequest(request, params.id, "checkin");
}
