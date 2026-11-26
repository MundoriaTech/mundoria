import type { CleanerProfile } from "@/types/cleaner";

/** Applied (or on hold) but not approved yet: jobs, diary, earnings and performance stay closed. */
export function isAwaitingApproval(cleaner: Pick<CleanerProfile, "status"> | null | undefined) {
  return cleaner?.status === "pending" || cleaner?.status === "in_training";
}
