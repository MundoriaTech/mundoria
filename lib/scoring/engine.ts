import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

export async function calculateCleanerScores(referenceDate = new Date()) {
  const admin = createAdminClient();
  const month = subMonths(referenceDate, 1);
  const from = startOfMonth(month);
  const to = endOfMonth(month);
  const { data: cleaners } = await admin
    .from("cleaner_profiles")
    .select("*")
    .in("status", ["certified", "active"]);
  const results: Record<string, unknown>[] = [];

  for (const cleaner of cleaners ?? []) {
    const [{ data: bookings }, { data: ratings }, { data: offers }] =
      await Promise.all([
        admin
          .from("bookings")
          .select("*")
          .eq("cleaner_id", cleaner.id)
          .gte("scheduled_date", from.toISOString().slice(0, 10))
          .lte("scheduled_date", to.toISOString().slice(0, 10)),
        admin
          .from("ratings")
          .select("overall_score,created_at")
          .eq("cleaner_id", cleaner.id)
          .gte("created_at", from.toISOString())
          .lte("created_at", to.toISOString()),
        admin
          .from("cleaner_job_responses")
          .select("response,offered_at")
          .eq("cleaner_id", cleaner.id)
          .gte("offered_at", from.toISOString())
          .lte("offered_at", to.toISOString()),
      ]);
    const periodBookings = bookings ?? [];
    const completed = periodBookings.filter(
      (booking) => booking.status === "completed",
    );
    const averageRating = ratings?.length
      ? ratings.reduce(
          (sum, rating) => sum + Number(rating.overall_score),
          0,
        ) / ratings.length
      : Number(cleaner.rating ?? 0);
    const onTimeJobs = completed.filter((booking) => {
      if (!booking.actual_start_time) return false;
      const scheduled = new Date(
        `${booking.scheduled_date}T${booking.scheduled_start_time}`,
      );
      return (
        new Date(booking.actual_start_time).getTime() <=
        scheduled.getTime() + 10 * 60 * 1000
      );
    }).length;
    const accepted = (offers ?? []).filter(
      (offer) => offer.response === "accepted",
    ).length;
    const cancellations = periodBookings.filter(
      (booking) => booking.status === "cancelled",
    ).length;
    const ratingScore = averageRating * 20;
    const onTimeScore = completed.length
      ? (onTimeJobs / completed.length) * 100
      : 100;
    const acceptanceScore = offers?.length
      ? (accepted / offers.length) * 100
      : 100;
    const cancellationScore = periodBookings.length
      ? Math.max(0, (1 - cancellations / periodBookings.length) * 100)
      : 100;
    const totalScore =
      ratingScore * 0.5 +
      onTimeScore * 0.2 +
      acceptanceScore * 0.15 +
      cancellationScore * 0.15;
    const totalJobs = Number(cleaner.total_jobs ?? 0);
    const tier =
      totalScore >= 90 &&
      averageRating >= 4.9 &&
      totalJobs >= 60 &&
      Number(cleaner.no_show_count) === 0
        ? "rose_gold"
        : totalScore >= 75 && averageRating >= 4.7 && totalJobs >= 30
          ? "gold"
          : totalScore >= 60 && averageRating >= 4.3 && totalJobs >= 10
            ? "silver"
            : "bronze";

    await admin
      .from("cleaner_profiles")
      .update({
        acceptance_rate: acceptanceScore,
        on_time_rate: onTimeScore,
        performance_score: totalScore,
        rating: averageRating,
        tier,
      })
      .eq("id", cleaner.id);
    await admin.from("performance_history").upsert(
      {
        acceptance_score: acceptanceScore,
        cancellation_score: cancellationScore,
        cleaner_id: cleaner.id,
        jobs_completed: completed.length,
        month: from.toISOString().slice(0, 10),
        on_time_score: onTimeScore,
        rating_score: ratingScore,
        tier_after: tier,
        tier_before: cleaner.tier,
        total_score: totalScore,
      },
      { onConflict: "cleaner_id,month" },
    );
    if (tier !== cleaner.tier) {
      await sendPushNotification(
        cleaner.id,
        "Your CleanScape tier changed",
        `You are now ${tier}. Your latest performance score is ${totalScore.toFixed(1)}.`,
        { tier, total_score: totalScore },
      );
    }
    results.push({
      cleanerId: cleaner.id,
      tier,
      totalScore,
    });
  }
  return results;
}
