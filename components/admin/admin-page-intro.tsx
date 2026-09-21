import { cn } from "@/lib/utils";

/** Description under the shell page title — avoids duplicate h1s. */
export function AdminPageIntro({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-5 max-w-2xl text-sm leading-6 text-[#5a5470] sm:mb-7 sm:text-base",
        className,
      )}
    >
      {children}
    </p>
  );
}
