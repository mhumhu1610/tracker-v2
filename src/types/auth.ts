export type AppRole = "viewer" | "member" | "team_lead" | "team_admin";

export interface Team {
  id: string;
  slug: string;
  name: string;
}

export interface UserProfile {
  id: string;
  team_id: string;
  role: AppRole;
  full_name: string | null;
  email: string | null;
  team?: Team;
}

export type SignUpRole = "team_admin" | "member";

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  teamSlug: string;
  role: SignUpRole;
}

export interface CompleteProfileInput {
  teamSlug: string;
  fullName: string;
  role: SignUpRole;
}
