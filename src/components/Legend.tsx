export function Legend() {
  const items = [
    { status: "Under-used", desc: "Below 70% — capacity available", color: "bg-amber-500" },
    { status: "Monitor", desc: "70–79% — approaching full load", color: "bg-sky-500" },
    { status: "Optimal", desc: "80–100% — well utilized", color: "bg-emerald-500" },
    { status: "Over-allocated", desc: "Above 100% — review assignments", color: "bg-rose-500" },
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-slate-200/80 bg-white/60 px-4 py-3 text-xs text-slate-600">
      {items.map((item) => (
        <div key={item.status} className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${item.color}`} />
          <span>
            <strong className="font-semibold text-slate-800">{item.status}</strong>
            {" — "}
            {item.desc}
          </span>
        </div>
      ))}
    </div>
  );
}
