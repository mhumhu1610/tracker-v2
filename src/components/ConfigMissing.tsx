export function ConfigMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="max-w-lg rounded-2xl border border-amber-300 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-bold text-navy-900">Configuration missing</h1>
        <p className="mt-3 text-sm text-slate-600">
          This app was built without Supabase environment variables, so it cannot
          start. A blank white page usually means the deploy platform did not
          receive <code className="rounded bg-slate-100 px-1">VITE_*</code> vars
          at <strong>build time</strong>.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>
            In your host (Vercel, Netlify, Cloudflare, etc.), add:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`VITE_SUPABASE_URL=https://oeqriusqgaqcoreusouq.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key`}
            </pre>
          </li>
          <li>Trigger a new deploy / rebuild (env vars are baked in at build).</li>
          <li>
            Publish the <code className="rounded bg-slate-100 px-1">dist</code>{" "}
            folder, or set build command to{" "}
            <code className="rounded bg-slate-100 px-1">npm run build</code> and
            output directory to <code className="rounded bg-slate-100 px-1">dist</code>.
          </li>
        </ol>
      </div>
    </div>
  );
}
