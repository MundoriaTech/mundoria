/**
 * Two Mundoria characters.
 * Profile photos are head-and-shoulders. Full-body drawings stay for the dashboard.
 */
export type AvatarCharacter = "woman" | "man";

export type DefaultAvatar = {
  id: AvatarCharacter;
  src: string;
  tint: string;
};

export const FEMALE_AVATAR_SRC = "/images/avatars/mundoria-woman.png";
export const MALE_AVATAR_SRC = "/images/avatars/mundoria-man.png";
export const FEMALE_PROFILE_SRC = "/images/avatars/mundoria-woman-profile.png";
export const MALE_PROFILE_SRC = "/images/avatars/mundoria-man-profile.png";

export const DEFAULT_AVATARS: DefaultAvatar[] = [
  {
    id: "woman",
    src: FEMALE_PROFILE_SRC,
    tint: "#f4ebfe",
  },
  {
    id: "man",
    src: MALE_PROFILE_SRC,
    tint: "#efe8ff",
  },
];

const WOMAN_SRCS = [FEMALE_PROFILE_SRC, FEMALE_AVATAR_SRC];
const MAN_SRCS = [MALE_PROFILE_SRC, MALE_AVATAR_SRC];

export function profileAvatarFor(character: AvatarCharacter) {
  return character === "man" ? MALE_PROFILE_SRC : FEMALE_PROFILE_SRC;
}

export function parseAvatarCharacter(
  value: string | null | undefined,
): AvatarCharacter | null {
  return value === "woman" || value === "man" ? value : null;
}

const RETIRED_AVATAR_FILES = [
  "dusk.svg",
  "peach.svg",
  "sage.svg",
  "mist.svg",
  "linen.svg",
  "coral.svg",
  "lilac.svg",
  "foam.svg",
  "honey.svg",
  "slate.svg",
  "petal.svg",
];

function matchesSrc(url: string, src: string) {
  return url === src || url.endsWith(src);
}

export function isRetiredAvatarUrl(url: string | null | undefined) {
  if (!url) return false;
  return RETIRED_AVATAR_FILES.some((file) => url.endsWith(`/images/avatars/${file}`));
}

export function mundoriaCharacter(
  url: string | null | undefined,
): "woman" | "man" | null {
  if (!url) return null;
  if (MAN_SRCS.some((src) => matchesSrc(url, src))) return "man";
  if (WOMAN_SRCS.some((src) => matchesSrc(url, src))) return "woman";
  return null;
}

export function isDefaultAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return mundoriaCharacter(url) !== null || isRetiredAvatarUrl(url);
}

/** Stable fallback when a user has no photo of their own. */
export function pickDefaultAvatar(seed?: string | null): DefaultAvatar {
  const pack = DEFAULT_AVATARS;
  if (!seed) return pack[0]!;

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pack[hash % pack.length]!;
}

export function isMundoriaCharacterUrl(url: string | null | undefined) {
  return mundoriaCharacter(url) !== null;
}

/** Headshots and uploaded photos both fill the circle. */
export function avatarImageClass(url?: string | null) {
  return mundoriaCharacter(url)
    ? "h-full w-full object-cover object-[center_40%]"
    : "h-full w-full object-cover object-center";
}

export function resolveAvatarUrl(
  url?: string | null,
  seed?: string | null,
): string {
  const character = mundoriaCharacter(url);
  if (character === "man") return MALE_PROFILE_SRC;
  if (character === "woman") return FEMALE_PROFILE_SRC;
  if (url && !isRetiredAvatarUrl(url)) return url;
  return pickDefaultAvatar(seed).src;
}
