import { supabase } from "../lib/supabase";
import type { Team } from "../types/auth";

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Team[];
}
