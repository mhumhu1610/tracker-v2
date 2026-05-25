import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them in your hosting provider before building.",
    );
  }
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

/** @deprecated Prefer getSupabase(); kept for gradual migration */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const instance = getSupabase();
    const value = instance[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
