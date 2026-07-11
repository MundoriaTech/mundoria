"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface FileUploadResult {
  file: File;
  path: string;
  publicUrl: string;
}

export function FileUpload({
  accept,
  bucket,
  className,
  disabled = false,
  label = "Upload file",
  maxSizeMb = 10,
  onUpload,
}: {
  accept: string | string[];
  bucket: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  maxSizeMb?: number;
  onUpload: (result: FileUploadResult) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acceptedTypes = Array.isArray(accept) ? accept.join(",") : accept;

  async function upload(file: File) {
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File must be ${maxSizeMb} MB or smaller.`);
      return;
    }
    setUploading(true);
    setError(null);
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      setError("Sign in before uploading a file.");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .slice(0, 60);
    const path = `${user.id}/${Date.now()}-${safeName}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    try {
      await onUpload({ file, path, publicUrl: data.publicUrl });
    } catch (uploadCallbackError) {
      setError(
        uploadCallbackError instanceof Error
          ? uploadCallbackError.message
          : "The file uploaded, but could not be saved.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-2", className)}>
      <Button
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        type="button"
        variant="outline"
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="mr-2 h-4 w-4" />
        )}
        {uploading ? "Uploading…" : label}
      </Button>
      <input
        accept={acceptedTypes}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        ref={inputRef}
        type="file"
      />
      {error ? (
        <p className="max-w-xs text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
