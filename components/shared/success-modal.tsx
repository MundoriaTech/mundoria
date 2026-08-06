"use client";

import { useEffect, useRef, useState } from "react";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

export type SuccessKind = "saved" | "deleted" | "updated" | "sent" | "done";

const TIDBITS: Record<SuccessKind, string[]> = {
  saved: [
    "Locked in. That’ll be ready next time you need it.",
    "Tucked away safely. Nice one.",
    "Saved and sorted — nothing more to do here.",
  ],
  deleted: [
    "Gone. Space cleared.",
    "Removed. No looking back.",
    "That’s out of the way.",
  ],
  updated: [
    "Fresh details, noted.",
    "All caught up on our side.",
    "Change applied. You’re good.",
  ],
  sent: [
    "On its way.",
    "Sent. They’ll see it shortly.",
    "Delivered to the queue.",
  ],
  done: [
    "That’s that — handled.",
    "Done. You can carry on.",
    "All set from here.",
  ],
};

function pickTidbit(kind: SuccessKind, note?: string) {
  if (note) return note;
  const options = TIDBITS[kind];
  const index = Math.floor(Date.now() / 1000) % options.length;
  return options[index]!;
}

export function SuccessModal({
  actionLabel = "Got it",
  autoCloseMs = 2500,
  kind = "done",
  note,
  onClose,
  title,
}: {
  actionLabel?: string;
  autoCloseMs?: number | false;
  kind?: SuccessKind;
  note?: string;
  onClose: () => void;
  title: string;
}) {
  const [paused, setPaused] = useState(false);
  const tidbit = useRef(pickTidbit(kind, note)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (autoCloseMs === false || paused) return;
    const id = window.setTimeout(() => onCloseRef.current(), autoCloseMs);
    return () => window.clearTimeout(id);
  }, [autoCloseMs, paused]);

  return (
    <AppModal
      accent="peach"
      description={tidbit}
      onClose={onClose}
      title={title}
    >
      <div
        className="mt-6 flex justify-end"
        onBlur={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Button
          className="bg-[#ffc79f] font-semibold text-[#221f50] hover:bg-[#ffd4b8]"
          onClick={onClose}
        >
          {actionLabel}
        </Button>
      </div>
    </AppModal>
  );
}
