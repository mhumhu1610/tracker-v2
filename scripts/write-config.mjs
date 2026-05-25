/**
 * Writes public/config.json from .env so static deploys include Supabase settings.
 * Runs before `vite build` (see package.json prebuild).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const envPath = resolve(process.cwd(), ".env");
const env = {
  ...parseEnvFile(envPath),
  ...process.env,
};

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    "[write-config] Skipped: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY not set in .env or environment.",
  );
  process.exit(0);
}

const config = {
  VITE_SUPABASE_URL: url,
  VITE_SUPABASE_ANON_KEY: key,
};

const outPath = resolve(process.cwd(), "public/config.json");
writeFileSync(outPath, `${JSON.stringify(config, null, 2)}\n`);
console.log("[write-config] Wrote public/config.json");
