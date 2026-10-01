import { ActionError } from "@/components/shared/action-error";

interface FormStatusProps {
  message: string | null;
  title?: string;
  tone?: "error" | "success";
}

export function FormStatus({
  message,
  title = "That didn’t work",
  tone = "error",
}: FormStatusProps) {
  if (!message) {
    return null;
  }

  if (tone === "success") {
    return (
      <div
        className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"
        role="status"
      >
        {message}
      </div>
    );
  }

  return <ActionError message={message} title={title} />;
}
