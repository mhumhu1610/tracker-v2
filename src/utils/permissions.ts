import type { AppRole } from "../types/auth";

export const ROLE_LABELS: Record<AppRole, string> = {
  viewer: "Viewer",
  member: "Member",
  team_lead: "Team Lead",
  team_admin: "Team Admin",
};

export function canEditCapacity(role: AppRole | undefined): boolean {
  return role === "team_admin" || role === "team_lead";
}

export function canExportReports(role: AppRole | undefined): boolean {
  return role === "team_admin";
}

export function isViewOnly(role: AppRole | undefined): boolean {
  return role === "viewer" || role === "member";
}
