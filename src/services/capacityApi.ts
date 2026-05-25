import { supabase } from "../lib/supabase";
import type { CapacitySheet, TeamMember } from "../types/capacity";

const DEFAULT_PROJECTS = [
  "Lotte",
  "XtraSure",
  "Padesar",
  "Zuellig",
  "Mastercard",
  "Internal",
];

interface DbSheet {
  id: string;
  team_id: string;
  month: string;
  year: number;
  projects: string[];
}

interface DbMember {
  id: string;
  sheet_id: string;
  name: string;
  pod: string;
  job_role: string;
  allocations: Record<string, number>;
  sort_order: number;
}

function toSheet(db: DbSheet, members: TeamMember[]): CapacitySheet {
  return {
    id: db.id,
    teamId: db.team_id,
    month: db.month,
    year: db.year,
    label: `${db.month} ${db.year}`,
    projects: db.projects?.length ? db.projects : [...DEFAULT_PROJECTS],
    members,
  };
}

function toMember(row: DbMember): TeamMember {
  return {
    id: row.id,
    name: row.name,
    pod: row.pod,
    role: row.job_role,
    allocations: row.allocations ?? {},
    sortOrder: row.sort_order,
  };
}

export async function fetchCapacitySheet(
  teamId: string,
  month: string,
  year: number,
): Promise<CapacitySheet | null> {
  const { data: sheet, error: sheetError } = await supabase
    .from("capacity_sheets")
    .select("id, team_id, month, year, projects")
    .eq("team_id", teamId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (sheetError) throw sheetError;
  if (!sheet) return null;

  const { data: members, error: membersError } = await supabase
    .from("capacity_members")
    .select("id, sheet_id, name, pod, job_role, allocations, sort_order")
    .eq("sheet_id", sheet.id)
    .order("sort_order", { ascending: true });

  if (membersError) throw membersError;

  return toSheet(
    sheet as DbSheet,
    (members ?? []).map((m) => toMember(m as DbMember)),
  );
}

export async function ensureCapacitySheet(
  teamId: string,
  month: string,
  year: number,
): Promise<CapacitySheet> {
  const existing = await fetchCapacitySheet(teamId, month, year);
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("capacity_sheets")
    .insert({
      team_id: teamId,
      month,
      year,
      projects: DEFAULT_PROJECTS,
    })
    .select("id, team_id, month, year, projects")
    .single();

  if (error) throw error;

  return toSheet(created as DbSheet, []);
}

export async function persistCapacitySheet(
  sheet: CapacitySheet,
): Promise<CapacitySheet> {
  const { error: sheetError } = await supabase
    .from("capacity_sheets")
    .update({
      projects: sheet.projects,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sheet.id);

  if (sheetError) throw sheetError;

  const { error: deleteError } = await supabase
    .from("capacity_members")
    .delete()
    .eq("sheet_id", sheet.id);

  if (deleteError) throw deleteError;

  if (sheet.members.length === 0) {
    return { ...sheet, members: [] };
  }

  const rows = sheet.members.map((member, index) => ({
    sheet_id: sheet.id,
    name: member.name,
    pod: member.pod,
    job_role: member.role,
    allocations: member.allocations,
    sort_order: index,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("capacity_members")
    .insert(rows)
    .select("id, sheet_id, name, pod, job_role, allocations, sort_order");

  if (insertError) throw insertError;

  return {
    ...sheet,
    members: (inserted ?? []).map((m) => toMember(m as DbMember)),
  };
}
