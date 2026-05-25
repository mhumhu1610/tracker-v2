import { CapacityTable } from "./components/CapacityTable";
import { AuthPage } from "./components/AuthPage";
import { Legend } from "./components/Legend";
import { OnboardingPage } from "./components/OnboardingPage";
import { SummaryCards } from "./components/SummaryCards";
import { Toolbar } from "./components/Toolbar";
import { useAuth } from "./contexts/AuthContext";
import { useCapacitySheet } from "./hooks/useCapacitySheet";
import { exportCapacitySheetCsv } from "./utils/exportCsv";
import { isViewOnly } from "./utils/permissions";

function Dashboard() {
  const { profile, signOut, canEdit, canExport, roleLabel } = useAuth();
  const {
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
  } = useCapacitySheet({
    teamId: profile?.team_id,
    canEdit,
  });

  const teamName = profile?.team?.name ?? "Team";

  const handleExport = () => {
    if (!sheet || !canExport) return;
    exportCapacitySheetCsv(sheet, teamName);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-navy-700">
                SC People Capacity
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
                Team Capacity & Resource Tracking
              </h1>
              {sheet && (
                <p className="mt-1 text-sm text-slate-500">
                  {teamName} — Input sheet {sheet.month}_{sheet.year}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-navy-800/10 px-3 py-1 font-medium text-navy-800">
                {teamName}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {roleLabel}
              </span>
              <span className="text-slate-500">
                {profile?.full_name ?? profile?.email}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {canExport && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
            <strong>Team Admin</strong> — Add your team members below, enter their
            project allocations, then use <strong>Export CSV</strong> for{" "}
            {teamName}&apos;s report. Other teams cannot see this data.
          </p>
        )}
        {isViewOnly(profile?.role) && (
          <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900">
            View-only — your Team Admin manages members and exports the team
            report.
          </p>
        )}

        {(error || loading) && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {loading ? "Loading your team capacity data…" : error}
          </div>
        )}

        {summary && sheet && (
          <>
            <SummaryCards summary={summary} />

            <Toolbar
              month={sheet.month}
              year={sheet.year}
              canEdit={canEdit}
              canExport={canExport}
              saving={saving}
              onPeriodChange={setPeriod}
              onAddMember={addMember}
              onAddProject={addProject}
              onExport={handleExport}
            />

            <Legend />

            <CapacityTable
              sheet={sheet}
              projectTotals={projectTotals}
              readOnly={!canEdit}
              onUpdateMember={updateMember}
              onUpdateAllocation={updateAllocation}
              onRemoveMember={removeMember}
              onRemoveProject={removeProject}
            />
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        {canEdit
          ? "Click any % cell to edit · Changes save automatically"
          : "Read-only · Team Admins can export CSV reports"}
      </footer>
    </div>
  );
}

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!profile) {
    return <OnboardingPage />;
  }

  return <Dashboard />;
}
