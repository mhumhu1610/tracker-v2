import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type {
  AppRole,
  CompleteProfileInput,
  SignUpInput,
  Team,
  UserProfile,
} from "../types/auth";
import { formatAuthError } from "../utils/authErrors";
import {
  canEditCapacity,
  canExportReports,
} from "../utils/permissions";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>;
  completeProfile: (input: CompleteProfileInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  canEdit: boolean;
  canExport: boolean;
  roleLabel: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      team_id,
      role,
      full_name,
      email,
      teams ( id, slug, name )
    `,
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const teamRow = Array.isArray(data.teams) ? data.teams[0] : data.teams;

  return {
    id: data.id,
    team_id: data.team_id,
    role: data.role as AppRole,
    full_name: data.full_name,
    email: data.email,
    team: teamRow as Team | undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const next = await loadProfile(user.id);
    setProfile(next);
    setError(null);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setError(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const next = await loadProfile(user.id);
        if (!cancelled) {
          setProfile(next);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw new Error(formatAuthError(signInError));
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          team_slug: input.teamSlug,
          role: input.role,
          full_name: input.fullName.trim(),
          signup_source: "app",
        },
      },
    });

    if (signUpError) throw new Error(formatAuthError(signUpError));

    const needsEmailConfirmation = !data.session;
    return { needsEmailConfirmation };
  }, []);

  const completeProfile = useCallback(
    async (input: CompleteProfileInput) => {
      setError(null);
      const { error: rpcError } = await supabase.rpc("complete_profile", {
        p_team_slug: input.teamSlug,
        p_full_name: input.fullName.trim(),
        p_role: input.role,
      });

      if (rpcError) throw rpcError;
      await refreshProfile();
    },
    [refreshProfile],
  );

  const signOut = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const canEdit = canEditCapacity(profile?.role);
  const canExport = canExportReports(profile?.role);

  const roleLabel = profile
    ? profile.role === "team_admin"
      ? "Team Admin"
      : profile.role === "team_lead"
        ? "Team Lead"
        : profile.role === "viewer"
          ? "Viewer"
          : "Member"
    : "";

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      error,
      signIn,
      signUp,
      completeProfile,
      signOut,
      refreshProfile,
      canEdit,
      canExport,
      roleLabel,
    }),
    [
      session,
      user,
      profile,
      loading,
      error,
      signIn,
      signUp,
      completeProfile,
      signOut,
      refreshProfile,
      canEdit,
      canExport,
      roleLabel,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
