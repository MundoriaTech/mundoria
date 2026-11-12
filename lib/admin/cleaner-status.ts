import type { InterviewStatus } from "@/types/cleaner";

export const ADMIN_CLEANER_STATUS_LABEL: Record<string, string> = {
  pending: "Needs review",
  in_training: "On hold",
  certified: "Approved",
  active: "Approved",
  suspended: "Suspended",
  removed: "Banned",
};

export const ADMIN_INTERVIEW_STATUS_LABEL: Record<InterviewStatus, string> = {
  not_started: "Not started",
  awaiting: "Awaiting call",
  completed: "Completed",
  failed: "Didn't proceed",
};

export function adminCleanerStatusLabel(status: string | null | undefined) {
  if (!status) return "Unknown";
  return (
    ADMIN_CLEANER_STATUS_LABEL[status] ?? status.replaceAll("_", " ")
  );
}
