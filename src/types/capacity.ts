export type CapacityStatus =
  | "Under-used"
  | "Monitor"
  | "Optimal"
  | "Over-allocated";

export interface TeamMember {
  id: string;
  name: string;
  pod: string;
  role: string;
  allocations: Record<string, number>;
  sortOrder?: number;
}

export interface CapacitySheet {
  id: string;
  teamId: string;
  label: string;
  month: string;
  year: number;
  projects: string[];
  members: TeamMember[];
}

export interface CapacitySummary {
  totalMembers: number;
  averageUtilization: number;
  underUsed: number;
  monitor: number;
  optimal: number;
  overAllocated: number;
}
