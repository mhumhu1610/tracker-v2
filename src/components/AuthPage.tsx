import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { fetchTeams } from "../services/teamsApi";
import type { SignUpRole, Team } from "../types/auth";
import { ROLE_LABELS } from "../utils/permissions";

type AuthMode = "signin" | "signup";

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [teams, setTeams] = useState<Team[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  const [role, setRole] = useState<SignUpRole>("team_admin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams()
      .then((list) => {
        setTeams(list);
        if (list.length > 0) setTeamSlug(list[0].slug);
      })
      .catch(() => {
        /* optional for sign-in */
      });
  }, []);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("rate limit")
      ) {
        setMode("signin");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamSlug) {
      setError("Please select your team");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const { needsEmailConfirmation } = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        teamSlug,
        role,
      });
      if (needsEmailConfirmation) {
        setSuccess(
          "Account created. Confirm your email, then sign in to manage your team and export reports.",
        );
        setMode("signin");
      } else {
        setSuccess("Account created. You can manage your team and export reports now.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-navy-700">
          SC People Capacity
        </p>
        <h1 className="mt-1 text-2xl font-bold text-navy-900">
          {mode === "signin" ? "Sign in" : "Team Admin sign up"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === "signin"
            ? "Each of the 8 teams has its own capacity sheet and CSV export."
            : "Register as your team’s admin to add members, track allocations, and export your team report."}
        </p>

        <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              mode === "signin"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-slate-600"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              mode === "signup"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-slate-600"
            }`}
          >
            Sign up
          </button>
        </div>

        <form
          onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
          className="mt-6 space-y-4"
        >
          {mode === "signup" && (
            <>
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
                  placeholder="e.g. Ma Theint"
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
                  Your team (1 of 8)
                </label>
                <select
                  id="team"
                  required
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
                  Account type
                </span>
                <div className="mt-2 space-y-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-navy-800/20 bg-navy-800/5 px-3 py-2.5">
                    <input
                      type="radio"
                      name="role"
                      checked={role === "team_admin"}
                      onChange={() => setRole("team_admin")}
                      className="mt-0.5"
                    />
                    <span className="text-sm">
                      <span className="font-semibold text-navy-900">
                        {ROLE_LABELS.team_admin}
                      </span>
                      <span className="block text-slate-500">
                        Manage team members, edit allocations, export CSV report
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                    <input
                      type="radio"
                      name="role"
                      checked={role === "member"}
                      onChange={() => setRole("member")}
                      className="mt-0.5"
                    />
                    <span className="text-sm">
                      <span className="font-semibold text-slate-800">
                        {ROLE_LABELS.member}
                      </span>
                      <span className="block text-slate-500">
                        View-only (for staff not managing the sheet)
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-600"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-600"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-navy-800 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60"
          >
            {submitting
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          <p className="font-semibold">“Email rate limit exceeded”?</p>
          <p className="mt-1">
            Supabase limits how many auth emails it sends per hour. For development:
            disable <strong>Confirm email</strong> in your project (Authentication
            → Providers → Email), then use <strong>Sign in</strong> or create users
            in Authentication → Users.
          </p>
        </div>
      </div>
    </div>
  );
}
