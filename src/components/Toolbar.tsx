import { useState } from "react";

interface ToolbarProps {
  month: string;
  year: number;
  canEdit: boolean;
  canExport: boolean;
  saving?: boolean;
  onPeriodChange: (month: string, year: number) => void;
  onAddMember: () => void;
  onAddProject: (name: string) => void;
  onExport: () => void;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function Toolbar({
  month,
  year,
  canEdit,
  canExport,
  saving,
  onPeriodChange,
  onAddMember,
  onAddProject,
  onExport,
}: ToolbarProps) {
  const [projectName, setProjectName] = useState("");

  const handleAddProject = () => {
    onAddProject(projectName);
    setProjectName("");
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-slate-500">Period</label>
        <select
          value={month}
          onChange={(e) => onPeriodChange(e.target.value, year)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15"
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => onPeriodChange(month, Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15"
        >
          {[2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {saving && (
          <span className="text-xs text-slate-400">Saving…</span>
        )}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {canExport && (
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-navy-800 bg-white px-4 py-2 text-sm font-semibold text-navy-800 shadow-sm transition hover:bg-navy-50"
          >
            Export CSV
          </button>
        )}

        {canEdit && (
          <>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
                placeholder="New project / client"
                className="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15"
              />
              <button
                type="button"
                onClick={handleAddProject}
                disabled={!projectName.trim()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
              >
                + Project
              </button>
            </div>
            <button
              type="button"
              onClick={onAddMember}
              className="rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700"
            >
              + Team member
            </button>
          </>
        )}
      </div>
    </div>
  );
}
