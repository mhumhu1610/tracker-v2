import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ensureCapacitySheet,
  fetchCapacitySheet,
  persistCapacitySheet,
} from "../services/capacityApi";
import type { CapacitySheet, CapacitySummary, TeamMember } from "../types/capacity";
import { deriveStatus, memberTotal } from "../utils/capacity";

function generateId(): string {
  return `new-${crypto.randomUUID().slice(0, 8)}`;
}

function ensureAllocations(
  allocations: Record<string, number>,
  projects: string[],
): Record<string, number> {
  const next = { ...allocations };
  for (const project of projects) {
    if (next[project] === undefined) next[project] = 0;
  }
  for (const key of Object.keys(next)) {
    if (!projects.includes(key)) delete next[key];
  }
  return next;
}

interface UseCapacitySheetOptions {
  teamId: string | undefined;
  canEdit: boolean;
}

export function useCapacitySheet({ teamId, canEdit }: UseCapacitySheetOptions) {
  const [sheet, setSheet] = useState<CapacitySheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSheet = useCallback(
    async (month: string, year: number) => {
      if (!teamId) return;
      setLoading(true);
      setError(null);
      try {
        let data = await fetchCapacitySheet(teamId, month, year);
        if (!data) {
          data = canEdit
            ? await ensureCapacitySheet(teamId, month, year)
            : null;
        }
        setSheet(data);
        if (!data) {
          setError("No capacity data for this period yet.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load capacity data");
        setSheet(null);
      } finally {
        setLoading(false);
      }
    },
    [teamId, canEdit],
  );

  useEffect(() => {
    if (!teamId) {
      setSheet(null);
      setLoading(false);
      return;
    }
    loadSheet("April", 2026);
  }, [teamId, loadSheet]);

  const scheduleSave = useCallback(
    (next: CapacitySheet) => {
      if (!canEdit) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          const saved = await persistCapacitySheet(next);
          setSheet(saved);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to save changes");
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [canEdit],
  );

  const updateSheet = useCallback(
    (updater: (prev: CapacitySheet) => CapacitySheet) => {
      setSheet((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const summary = useMemo<CapacitySummary | null>(() => {
    if (!sheet) return null;
    const totals = sheet.members.map((m) => memberTotal(m));
    const statuses = totals.map(deriveStatus);

    return {
      totalMembers: sheet.members.length,
      averageUtilization:
        totals.length > 0
          ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
          : 0,
      underUsed: statuses.filter((s) => s === "Under-used").length,
      monitor: statuses.filter((s) => s === "Monitor").length,
      optimal: statuses.filter((s) => s === "Optimal").length,
      overAllocated: statuses.filter((s) => s === "Over-allocated").length,
    };
  }, [sheet]);

  const updateMember = useCallback(
    (id: string, patch: Partial<TeamMember>) => {
      if (!canEdit) return;
      updateSheet((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === id ? { ...m, ...patch } : m,
        ),
      }));
    },
    [canEdit, updateSheet],
  );

  const updateAllocation = useCallback(
    (memberId: string, project: string, value: number) => {
      if (!canEdit) return;
      updateSheet((prev) => ({
        ...prev,
        members: prev.members.map((m) => {
          if (m.id !== memberId) return m;
          return {
            ...m,
            allocations: { ...m.allocations, [project]: value },
          };
        }),
      }));
    },
    [canEdit, updateSheet],
  );

  const addMember = useCallback(() => {
    if (!canEdit) return;
    updateSheet((prev) => {
      const allocations = Object.fromEntries(
        prev.projects.map((p) => [p, 0]),
      );
      const member: TeamMember = {
        id: generateId(),
        name: "New Member",
        pod: "",
        role: "",
        allocations,
      };
      return { ...prev, members: [...prev.members, member] };
    });
  }, [canEdit, updateSheet]);

  const removeMember = useCallback(
    (id: string) => {
      if (!canEdit) return;
      updateSheet((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
      }));
    },
    [canEdit, updateSheet],
  );

  const addProject = useCallback(
    (name: string) => {
      if (!canEdit) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      updateSheet((prev) => {
        if (prev.projects.includes(trimmed)) return prev;
        const projects = [...prev.projects, trimmed];
        return {
          ...prev,
          projects,
          members: prev.members.map((m) => ({
            ...m,
            allocations: ensureAllocations(m.allocations, projects),
          })),
        };
      });
    },
    [canEdit, updateSheet],
  );

  const removeProject = useCallback(
    (name: string) => {
      if (!canEdit) return;
      updateSheet((prev) => {
        const projects = prev.projects.filter((p) => p !== name);
        return {
          ...prev,
          projects,
          members: prev.members.map((m) => ({
            ...m,
            allocations: ensureAllocations(m.allocations, projects),
          })),
        };
      });
    },
    [canEdit, updateSheet],
  );

  const projectTotals = useMemo(() => {
    if (!sheet) return {};
    return Object.fromEntries(
      sheet.projects.map((project) => [
        project,
        sheet.members.reduce(
          (sum, m) => sum + (m.allocations[project] ?? 0),
          0,
        ),
      ]),
    );
  }, [sheet]);

  const setPeriod = useCallback(
    (month: string, year: number) => {
      loadSheet(month, year);
    },
    [loadSheet],
  );

  return {
    sheet,
    summary,
    projectTotals,
    loading,
    saving,
    error,
    updateMember,
    updateAllocation,
    addMember,
    removeMember,
    addProject,
    removeProject,
    setPeriod,
  };
}
