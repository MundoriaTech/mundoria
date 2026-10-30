import { permanentRedirect } from "next/navigation";

/** Wider-area cleaners hubs overlapped local place pages — one Birmingham hub is enough. */
export default function BirminghamWiderRedirect() {
  permanentRedirect("/cleaners/birmingham");
}
