import type { CapacityStatus, TeamMember } from "../types/capacity";

export function calculateTotal(allocations: Record<string, number>): number {
  return Object.values(allocations).reduce((sum, value) => sum + (value || 0), 0);
}

export function deriveStatus(total: number): CapacityStatus {
  if (total > 100) return "Over-allocated";
  if (total >= 80 && total <= 100) return "Optimal";
  if (total >= 70) return "Monitor";
  return "Under-used";
}

export function formatPercent(value: number): string {
  if (value === 0) return "";
  return `${value}%`;
}

export function parsePercentInput(raw: string): number {
  const cleaned = raw.replace(/%/g, "").trim();
  if (cleaned === "") return 0;
  const parsed = Number.parseFloat(cleaned);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

export function memberTotal(member: TeamMember): number {
  return calculateTotal(member.allocations);
}

export function memberStatus(member: TeamMember): CapacityStatus {
  return deriveStatus(memberTotal(member));
}

export const STATUS_STYLES: Record<
  CapacityStatus,
  { badge: string; dot: string }
> = {
  "Under-used": {
    badge: "bg-amber-100 text-amber-900 ring-amber-200",
    dot: "bg-amber-500",
  },
  Monitor: {
    badge: "bg-sky-100 text-sky-900 ring-sky-200",
    dot: "bg-sky-500",
  },
  Optimal: {
    badge: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  "Over-allocated": {
    badge: "bg-rose-100 text-rose-900 ring-rose-200",
    dot: "bg-rose-500",
  },
};
