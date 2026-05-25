export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let runtime: SupabaseConfig | null = null;

function fromViteEnv(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL ?? "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getSupabaseConfig(): SupabaseConfig | null {
  return runtime ?? fromViteEnv();
}

export function setRuntimeSupabaseConfig(config: SupabaseConfig): void {
  runtime = config;
}

export function isConfigReady(): boolean {
  return getSupabaseConfig() !== null;
}

export async function loadRuntimeConfig(): Promise<boolean> {
  if (fromViteEnv()) return true;
  if (runtime) return true;

  try {
    const base = import.meta.env.BASE_URL ?? "/";
    const res = await fetch(`${base}config.json`, { cache: "no-store" });
    if (!res.ok) return false;

    const data = (await res.json()) as {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
    };

    const url = data.VITE_SUPABASE_URL?.trim();
    const anonKey = data.VITE_SUPABASE_ANON_KEY?.trim();
    if (!url || !anonKey) return false;

    setRuntimeSupabaseConfig({ url, anonKey });
    return true;
  } catch {
    return false;
  }
}
