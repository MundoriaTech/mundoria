import {
  isRetiredAvatarUrl,
  mundoriaCharacter,
  parseAvatarCharacter,
  pickDefaultAvatar,
  type AvatarCharacter,
} from "@/lib/avatars/default-pack";

/** What the cleaner dashboard already knows, in the order that should win. */
export type CleanerHeroMoment = "offer" | "visit" | "streak" | "clear";

const WOMAN_POSES: Record<CleanerHeroMoment, string> = {
  offer: "/images/avatars/mundoria-woman-offer.png",
  visit: "/images/avatars/mundoria-woman-walk.png",
  streak: "/images/avatars/mundoria-woman-streak.png",
  clear: "/images/avatars/mundoria-woman-wave.png",
};

const MAN_POSES: Record<CleanerHeroMoment, string> = {
  offer: "/images/avatars/mundoria-man-offer.png",
  visit: "/images/avatars/mundoria-man-walk.png",
  streak: "/images/avatars/mundoria-man-streak.png",
  clear: "/images/avatars/mundoria-man-wave.png",
};

export function cleanerHero({
  avatarUrl,
  gender,
  hasOffer,
  hasVisitToday,
  seed,
  streak,
}: {
  avatarUrl?: string | null;
  gender?: string | null;
  hasOffer: boolean;
  hasVisitToday: boolean;
  seed?: string | null;
  streak: number;
}) {
  const moment: CleanerHeroMoment = hasOffer
    ? "offer"
    : hasVisitToday
      ? "visit"
      : streak > 0
        ? "streak"
        : "clear";
  return {
    moment,
    src: (usesMan(avatarUrl, seed, parseAvatarCharacter(gender)) ? MAN_POSES : WOMAN_POSES)[moment],
  };
}

function usesMan(
  url?: string | null,
  seed?: string | null,
  gender?: AvatarCharacter | null,
) {
  const character = mundoriaCharacter(url);
  if (character === "man") return true;
  if (character === "woman") return false;
  if (gender === "man") return true;
  if (gender === "woman") return false;
  if (!url || isRetiredAvatarUrl(url)) return pickDefaultAvatar(seed).id === "man";
  return false;
}
