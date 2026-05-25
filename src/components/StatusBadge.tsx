import type { CapacityStatus } from "../types/capacity";
import { STATUS_STYLES } from "../utils/capacity";

interface StatusBadgeProps {
  status: CapacityStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {status}
    </span>
  );
}
