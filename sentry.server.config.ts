import * as Sentry from "@sentry/nextjs";
import { redactCalendarTelemetry } from "./lib/zoho/calendar-telemetry";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,
  beforeBreadcrumb: (breadcrumb) => redactCalendarTelemetry(breadcrumb),
  beforeSend: (event) => redactCalendarTelemetry(event),
  beforeSendTransaction: (event) => redactCalendarTelemetry(event),
});
