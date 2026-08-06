/**
 * CleanScape default avatar pack — Discord-style illustrated options.
 * Paths are public URLs stored on `profiles.avatar_url` when selected.
 */
export type DefaultAvatar = {
  id: string;
  label: string;
  src: string;
  /** Soft background tint for picker chrome */
  tint: string;
};

export const DEFAULT_AVATARS: DefaultAvatar[] = [
  {
    id: "dusk",
    label: "Dusk",
    src: "/images/avatars/dusk.svg",
    tint: "#221F50",
  },
  {
    id: "peach",
    label: "Peach",
    src: "/images/avatars/peach.svg",
    tint: "#FFC79F",
  },
  {
    id: "sage",
    label: "Sage",
    src: "/images/avatars/sage.svg",
    tint: "#C8D5C3",
  },
  {
    id: "mist",
    label: "Mist",
    src: "/images/avatars/mist.svg",
    tint: "#B9D0E8",
  },
  {
    id: "linen",
    label: "Linen",
    src: "/images/avatars/linen.svg",
    tint: "#EFE6D8",
  },
  {
    id: "coral",
    label: "Coral",
    src: "/images/avatars/coral.svg",
    tint: "#F0B7A0",
  },
  {
    id: "lilac",
    label: "Lilac",
    src: "/images/avatars/lilac.svg",
    tint: "#DCD9EE",
  },
  {
    id: "foam",
    label: "Foam",
    src: "/images/avatars/foam.svg",
    tint: "#B8DDD0",
  },
  {
    id: "honey",
    label: "Honey",
    src: "/images/avatars/honey.svg",
    tint: "#F4E3A8",
  },
  {
    id: "slate",
    label: "Slate",
    src: "/images/avatars/slate.svg",
    tint: "#4A5568",
  },
  {
    id: "petal",
    label: "Petal",
    src: "/images/avatars/petal.svg",
    tint: "#E8C4D4",
  },
];

export function isDefaultAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return DEFAULT_AVATARS.some(
    (avatar) => url === avatar.src || url.endsWith(avatar.src),
  );
}

/** Stable Discord-style fallback when a user has no avatar set. */
export function pickDefaultAvatar(seed?: string | null): DefaultAvatar {
  const pack = DEFAULT_AVATARS;
  if (!seed) return pack[0]!;

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pack[hash % pack.length]!;
}

export function resolveAvatarUrl(
  url?: string | null,
  seed?: string | null,
): string {
  if (url) return url;
  return pickDefaultAvatar(seed).src;
}
