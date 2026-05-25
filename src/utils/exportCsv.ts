import type { CapacitySheet } from "../types/capacity";
import { deriveStatus, memberTotal } from "./capacity";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportCapacitySheetCsv(sheet: CapacitySheet, teamName: string): void {
  const headers = [
    "Name",
    "Pod",
    "Role",
    ...sheet.projects,
    "Total %",
    "Status",
  ];

  const rows = sheet.members.map((member) => {
    const total = memberTotal(member);
    return [
      member.name,
      member.pod,
      member.role,
      ...sheet.projects.map((p) => String(member.allocations[p] ?? 0)),
      String(total),
      deriveStatus(total),
    ];
  });

  const csv = [
    `# ${teamName} — ${sheet.month} ${sheet.year}`,
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${teamName.replace(/\s+/g, "-")}-capacity-${sheet.month}-${sheet.year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
