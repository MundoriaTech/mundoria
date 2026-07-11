export function isAuthorizedCron(request: Request) {
  return Boolean(
    process.env.CRON_SECRET &&
      request.headers.get("authorization") ===
        `Bearer ${process.env.CRON_SECRET}`,
  );
}
