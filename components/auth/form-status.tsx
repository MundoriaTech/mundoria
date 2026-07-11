interface FormStatusProps {
  message: string | null;
  tone?: "error" | "success";
}

export function FormStatus({ message, tone = "error" }: FormStatusProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        tone === "success"
          ? "rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"
          : "rounded-md bg-destructive/10 p-3 text-sm text-destructive"
      }
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
