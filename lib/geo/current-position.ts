/**
 * Read the device location for check-in, check-out and live sharing.
 * Tries precise GPS first, then a normal-accuracy fix (Wi-Fi / mobile
 * network), and turns the browser's error into something a cleaner can act on.
 */
export class LocationError extends Error {}

function readOnce(options: PositionOptions) {
  return new Promise<GeolocationCoordinates>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      reject,
      options,
    ),
  );
}

export function locationErrorMessage(error: unknown) {
  const code = (error as GeolocationPositionError | undefined)?.code;
  if (code === 1) {
    return "Location is blocked for Mundoria. Allow location for this site in your browser, and for your browser in your phone's settings, then try again.";
  }
  if (code === 2) {
    return "Your device couldn't find its location. Turn on Location in your phone's settings (and precise location), then try again.";
  }
  if (code === 3) {
    return "Getting your location took too long. Move near a window or outside, check Location is on, and try again.";
  }
  return "We couldn't read your location. Check Location is on and allowed for your browser, then try again.";
}

export async function getCurrentCoords() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new LocationError(
      "This browser can't share your location. Open Mundoria in Chrome or Safari.",
    );
  }
  try {
    return await readOnce({ enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 });
  } catch (error) {
    // A blocked permission won't change on a second try.
    if ((error as GeolocationPositionError)?.code === 1) {
      throw new LocationError(locationErrorMessage(error));
    }
    try {
      return await readOnce({ enableHighAccuracy: false, maximumAge: 120_000, timeout: 20_000 });
    } catch (fallbackError) {
      throw new LocationError(locationErrorMessage(fallbackError));
    }
  }
}
