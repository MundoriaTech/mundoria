/** Upload a file to Supabase Storage with XHR progress (0–100). */
export function uploadWithProgress({
  accessToken,
  anonKey,
  bucket,
  file,
  onProgress,
  path,
  supabaseUrl,
}: {
  accessToken: string;
  anonKey: string;
  bucket: string;
  file: File;
  onProgress?: (percent: number) => void;
  path: string;
  supabaseUrl: string;
}) {
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "false");
    if (file.type) {
      xhr.setRequestHeader("Content-Type", file.type);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100))));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      let message = `Upload failed (${xhr.status}).`;
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        message = body.message || body.error || message;
      } catch {
        if (xhr.responseText) message = xhr.responseText.slice(0, 180);
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(file);
  });
}
