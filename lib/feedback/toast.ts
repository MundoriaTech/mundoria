import { toast as sonner, type ExternalToast } from "sonner";

type ToastOptions = Pick<
  ExternalToast,
  "action" | "cancel" | "description" | "duration" | "id" | "onDismiss"
>;

/**
 * Outcome feedback. Use for the result of an action (saved, sent, failed),
 * never for field validation, which stays inline next to the field.
 */
export const toast = {
  dismiss(id?: string | number) {
    sonner.dismiss(id);
  },

  error(title: string, options?: ToastOptions) {
    return sonner.error(title, { duration: 6000, ...options });
  },

  info(title: string, options?: ToastOptions) {
    return sonner.info(title, options);
  },

  loading(title: string, options?: ToastOptions) {
    return sonner.loading(title, options);
  },

  /**
   * Tracks an async action from pending to done in one toast.
   * `error` may be a string or a function that reads the thrown error.
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      error: string | ((error: unknown) => string);
      loading: string;
      success: string | ((value: T) => string);
    },
    options?: ToastOptions,
  ) {
    return sonner.promise(promise, {
      ...options,
      error: (error: unknown) =>
        typeof messages.error === "function"
          ? messages.error(error)
          : messages.error,
      loading: messages.loading,
      success: (value: T) =>
        typeof messages.success === "function"
          ? messages.success(value)
          : messages.success,
    });
  },

  success(title: string, options?: ToastOptions) {
    return sonner.success(title, options);
  },

  warning(title: string, options?: ToastOptions) {
    return sonner.warning(title, options);
  },
};

/** Turns an unknown thrown value into a toast-friendly message. */
export function errorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}
