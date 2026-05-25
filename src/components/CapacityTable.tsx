import type { CapacitySheet, TeamMember } from "../types/capacity";
import { memberStatus, memberTotal } from "../utils/capacity";
import { EditableCell } from "./EditableCell";
import { StatusBadge } from "./StatusBadge";

interface CapacityTableProps {
  sheet: CapacitySheet;
  projectTotals: Record<string, number>;
  readOnly: boolean;
  onUpdateMember: (id: string, patch: Partial<TeamMember>) => void;
  onUpdateAllocation: (memberId: string, project: string, value: number) => void;
  onRemoveMember: (id: string) => void;
  onRemoveProject: (name: string) => void;
}

export function CapacityTable({
  sheet,
  projectTotals,
  readOnly,
  onUpdateMember,
  onUpdateAllocation,
  onRemoveMember,
  onRemoveProject,
}: CapacityTableProps) {
  const colCount = 4 + sheet.projects.length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-navy-800 text-white">
              <th className="sticky left-0 z-10 min-w-[160px] bg-navy-800 px-4 py-3 text-left font-semibold">
                Name
              </th>
              <th className="min-w-[120px] px-3 py-3 text-left font-semibold">
                Pod
              </th>
              <th className="min-w-[150px] px-3 py-3 text-left font-semibold">
                Role
              </th>
              {sheet.projects.map((project) => (
                <th
                  key={project}
                  className="group min-w-[88px] px-2 py-3 text-center font-semibold"
                >
                  <span className="inline-flex items-center gap-1">
                    {project}
                    {!readOnly && sheet.projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveProject(project)}
                        className="ml-0.5 rounded p-0.5 text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                        title={`Remove ${project}`}
                        aria-label={`Remove project ${project}`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                </th>
              ))}
              <th className="min-w-[80px] px-3 py-3 text-center font-semibold">
                Total %
              </th>
              <th className="min-w-[130px] px-3 py-3 text-left font-semibold">
                Status
              </th>
              {!readOnly && (
                <th className="w-10 px-2 py-3" aria-label="Actions" />
              )}
            </tr>
          </thead>
          <tbody>
            {sheet.members.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount + (readOnly ? 0 : 1)}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No team members for this period.
                </td>
              </tr>
            ) : (
              sheet.members.map((member, index) => {
                const rowBg =
                  index % 2 === 0 ? "bg-sheet-beige" : "bg-sheet-mint";
                const total = memberTotal(member);
                const status = memberStatus(member);

                return (
                  <tr
                    key={member.id}
                    className={`${rowBg} border-b border-slate-100/80 transition-colors hover:brightness-[0.98]`}
                  >
                    <td
                      className={`sticky left-0 z-10 ${rowBg} px-3 py-1 font-bold`}
                    >
                      {readOnly ? (
                        <span className="block px-1 py-1.5">{member.name}</span>
                      ) : (
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) =>
                            onUpdateMember(member.id, { name: e.target.value })
                          }
                          className="w-full rounded border-0 bg-transparent px-1 py-1.5 font-bold outline-none focus:ring-2 focus:ring-navy-800/20"
                          placeholder="Name"
                        />
                      )}
                    </td>
                    <td className="px-2 py-1">
                      {readOnly ? (
                        <span className="block px-1 py-1.5">{member.pod}</span>
                      ) : (
                        <input
                          type="text"
                          value={member.pod}
                          onChange={(e) =>
                            onUpdateMember(member.id, { pod: e.target.value })
                          }
                          className="w-full rounded border-0 bg-transparent px-1 py-1.5 outline-none focus:ring-2 focus:ring-navy-800/20"
                          placeholder="Pod"
                        />
                      )}
                    </td>
                    <td className="px-2 py-1">
                      {readOnly ? (
                        <span className="block px-1 py-1.5">{member.role}</span>
                      ) : (
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) =>
                            onUpdateMember(member.id, { role: e.target.value })
                          }
                          className="w-full rounded border-0 bg-transparent px-1 py-1.5 outline-none focus:ring-2 focus:ring-navy-800/20"
                          placeholder="Role"
                        />
                      )}
                    </td>
                    {sheet.projects.map((project) => (
                      <td key={project} className="px-1 py-0">
                        <EditableCell
                          value={member.allocations[project] ?? 0}
                          onChange={(v) =>
                            onUpdateAllocation(member.id, project, v)
                          }
                          readOnly={readOnly}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-center">
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          total > 100
                            ? "text-rose-600"
                            : "text-accent-blue"
                        }`}
                      >
                        {total > 0 ? `${total}%` : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <StatusBadge status={status} />
                    </td>
                    {!readOnly && (
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          onClick={() => onRemoveMember(member.id)}
                          className="rounded p-1 text-slate-400 transition hover:bg-white/80 hover:text-rose-600"
                          title="Remove member"
                          aria-label={`Remove ${member.name || "member"}`}
                        >
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-navy-900/5 font-semibold text-slate-700">
              <td
                colSpan={3}
                className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5"
              >
                Project totals
              </td>
              {sheet.projects.map((project) => (
                <td
                  key={project}
                  className="px-2 py-2.5 text-center text-sm text-accent-blue tabular-nums"
                >
                  {projectTotals[project] > 0
                    ? `${projectTotals[project]}%`
                    : "—"}
                </td>
              ))}
              <td colSpan={readOnly ? 2 : 3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
