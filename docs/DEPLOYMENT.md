# Deployment guide

## Why the deployed site is blank

Most often one of these:

### 1. Missing environment variables at build time (most common)

Vite embeds `VITE_*` variables when you run `npm run build`. If your host does not have them, the app shows a **Configuration missing** screen (or used to show a blank page).

**Fix:** Add these in your hosting dashboard, then **redeploy**:

| Variable | Example |
|----------|---------|
| `VITE_SUPABASE_URL` | `https://oeqriusqgaqcoreusouq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your Supabase publishable / anon key |

### 2. Wrong publish folder

Publish **`dist`** (output of `npm run build`), not the project root.

| Platform | Build command | Output directory |
|----------|---------------|------------------|
| Vercel | `npm run build` | `dist` |
| Netlify | `npm run build` | `dist` |
| Cloudflare Pages | `npm run build` | `dist` |

### 3. SPA routing (404 on refresh)

The repo includes `vercel.json`, `netlify.toml`, and `public/_redirects` so all routes serve `index.html`.

### 4. GitHub Pages subdirectory

If the site is `https://user.github.io/Tracker-V2/`, set in the host:

```
VITE_BASE_PATH=/Tracker-V2/
```

And add to `vite.config.ts` (or we can enable this when you confirm the repo name).

---

## Vercel

1. Import Git repo  
2. Framework: Vite  
3. Environment variables → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`  
4. Deploy  

## Netlify

1. Build command: `npm run build`  
2. Publish directory: `dist`  
3. Site settings → Environment variables → add both `VITE_*` vars  
4. Deploy  

## Manual

```bash
npm install
npm run build
# upload contents of dist/ to any static host
```

## Verify locally before deploy

```bash
cp .env.example .env   # fill in real values
npm run build
npm run preview
# open http://localhost:4173
```

If preview works but production is blank, the host is missing env vars at build time.
