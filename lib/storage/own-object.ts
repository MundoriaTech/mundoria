import { isDefaultAvatarUrl } from "@/lib/avatars/default-pack";

/** Path inside a bucket for a file this user uploaded, or null for defaults and other people's files. */
export function ownStoragePath(
  bucket: string,
  reference: string | null | undefined,
  userId: string,
) {
  if (!reference || isDefaultAvatarUrl(reference) || reference.startsWith("blob:")) {
    return null;
  }

  let path = reference;
  const publicMarker = `/storage/v1/object/public/${bucket}/`;
  const signedMarker = `/storage/v1/object/sign/${bucket}/`;
  const publicIndex = reference.indexOf(publicMarker);
  const signedIndex = reference.indexOf(signedMarker);

  if (publicIndex >= 0) {
    path = reference.slice(publicIndex + publicMarker.length);
  } else if (signedIndex >= 0) {
    path = reference.slice(signedIndex + signedMarker.length);
  } else if (reference.startsWith("http")) {
    return null;
  }

  path = decodeURIComponent(path.split("?")[0] ?? "");
  if (!path.startsWith(`${userId}/`) || path.includes("..")) return null;
  return path;
}
