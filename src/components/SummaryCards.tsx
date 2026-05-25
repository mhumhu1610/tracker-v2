import type { CapacitySummary } from "../types/capacity";

interface SummaryCardsProps {
  summary: CapacitySummary;
}

const cards = [
  {
    key: "totalMembers" as const,
    label: "Team members",
    format: (s: CapacitySummary) => String(s.totalMembers),
    accent: "text-navy-800",
    bg: "bg-white",
  },
  {
    key: "averageUtilization" as const,
    label: "Avg utilization",
    format: (s: CapacitySummary) => `${s.averageUtilization}%`,
    accent: "text-accent-blue",
    bg: "bg-white",
  },
  {
    key: "underUsed" as const,
    label: "Under-used",
    format: (s: CapacitySummary) => String(s.underUsed),
    accent: "text-amber-700",
    bg: "bg-amber-50/80",
  },
  {
    key: "monitor" as const,
    label: "Monitor",
    format: (s: CapacitySummary) => String(s.monitor),
    accent: "text-sky-700",
    bg: "bg-sky-50/80",
  },
  {
    key: "optimal" as const,
    label: "Optimal",
    format: (s: CapacitySummary) => String(s.optimal),
    accent: "text-emerald-700",
    bg: "bg-emerald-50/80",
  },
  {
    key: "overAllocated" as const,
    label: "Over-allocated",
    format: (s: CapacitySummary) => String(s.overAllocated),
    accent: "text-rose-700",
    bg: "bg-rose-50/80",
  },
];

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-xl border border-slate-200/80 px-4 py-3 shadow-sm ${card.bg}`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {card.label}
          </p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${card.accent}`}>
            {card.format(summary)}
          </p>
        </div>
      ))}
    </div>
  );
}
