import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { fetchTeams } from "../services/teamsApi";
import type { SignUpRole, Team } from "../types/auth";
import { ROLE_LABELS } from "../utils/permissions";

export function OnboardingPage() {
  const { user, completeProfile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamSlug, setTeamSlug] = useState("");
  const [role, setRole] = useState<SignUpRole>("team_admin");
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name ?? "",
  );
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams()
      .then((list) => {
        setTeams(list);
        if (list.length > 0) setTeamSlug(list[0].slug);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load teams"),
      )
      .finally(() => setLoadingTeams(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamSlug) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeProfile({ teamSlug, fullName, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete setup");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-navy-700">
          Almost there
        </p>
        <h1 className="mt-1 text-2xl font-bold text-navy-900">Set up your team</h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose your team and role. Team Admins manage member capacity rows and
          export their team’s CSV report.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-slate-600"
            >
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15"
            />
          </div>

          <div>
            <label
              htmlFor="team"
              className="block text-xs font-medium text-slate-600"
            >
              Team
            </label>
            <select
              id="team"
              required
              disabled={loadingTeams}
              value={teamSlug}
              onChange={(e) => setTeamSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15"
            >
              {teams.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600">
              Role
            </span>
            <div className="mt-2 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-navy-800/20 bg-navy-800/5 px-3 py-2">
                <input
                  type="radio"
                  name="role"
                  checked={role === "team_admin"}
                  onChange={() => setRole("team_admin")}
                />
                <span className="text-sm font-medium">
                  {ROLE_LABELS.team_admin} — edit & export
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <input
                  type="radio"
                  name="role"
                  checked={role === "member"}
                  onChange={() => setRole("member")}
                />
                <span className="text-sm font-medium">
                  {ROLE_LABELS.member} — view only
                </span>
              </label>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || loadingTeams || !teamSlug}
            className="w-full rounded-lg bg-navy-800 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Continue to dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
