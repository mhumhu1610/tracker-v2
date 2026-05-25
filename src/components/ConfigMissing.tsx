export function ConfigMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="max-w-lg rounded-2xl border border-amber-300 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-bold text-navy-900">Configuration missing</h1>
        <p className="mt-3 text-sm text-slate-600">
          Supabase URL and API key were not found. Use <strong>one</strong> of the
          options below, then redeploy.
        </p>

        <div className="mt-5 space-y-4 text-sm text-slate-700">
          <section>
            <h2 className="font-semibold text-navy-900">Option A — Hosting env vars</h2>
            <p className="mt-1">
              In Vercel / Netlify / Cloudflare → Environment variables, add:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`VITE_SUPABASE_URL=https://oeqriusqgaqcoreusouq.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here`}
            </pre>
            <p className="mt-1 text-slate-500">Redeploy after saving.</p>
          </section>

          <section>
            <h2 className="font-semibold text-navy-900">
              Option B — config.json (quick fix)
            </h2>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              <li>
                Copy <code className="rounded bg-slate-100 px-1">public/config.example.json</code>{" "}
                to <code className="rounded bg-slate-100 px-1">public/config.json</code>
              </li>
              <li>Paste your real Supabase URL and anon/publishable key</li>
              <li>
                Run <code className="rounded bg-slate-100 px-1">npm run build</code> and redeploy{" "}
                <code className="rounded bg-slate-100 px-1">dist</code>
              </li>
            </ol>
            <p className="mt-2 text-slate-500">
              Or run <code className="rounded bg-slate-100 px-1">npm run build</code> locally
              (with a filled <code className="rounded bg-slate-100 px-1">.env</code>) — it
              auto-generates <code className="rounded bg-slate-100 px-1">config.json</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
