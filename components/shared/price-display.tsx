import { formatMoney } from "@/lib/customer/services";
import { cn } from "@/lib/utils";

export function PriceDisplay({
  amount,
  className,
}: {
  amount: number | null | undefined;
  className?: string;
}) {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatMoney(amount)}
    </span>
  );
}
