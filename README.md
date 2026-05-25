# Team Capacity & Resource Tracking Dashboard

Team-scoped capacity tracking with Supabase auth, **8 teams**, **4 roles**, and self-service signup.

## Fix: "Email rate limit exceeded"

Supabase limits auth emails per hour. For development: **Authentication → Providers → Email → turn OFF Confirm email**. Or use **Sign in** / create users in Dashboard with **Auto Confirm**. Details: [docs/SUPABASE_EMAIL_RATE_LIMIT.md](docs/SUPABASE_EMAIL_RATE_LIMIT.md)

## Fix: "Database error creating new user"

This happens when the old trigger **blocked** user creation if `team_slug` was missing or invalid.

**Run migrations 002a then 002** in Supabase SQL Editor (two steps — required by PostgreSQL enums):

1. `supabase/migrations/002a_add_enum_roles.sql`
2. `supabase/migrations/002_fix_auth_signup_roles.sql`

After that:

| How users are created | What happens |
|----------------------|--------------|
| **Sign up** in the app | Team + Member role set automatically |
| **Dashboard** with no metadata | User created; they pick a team on first login |
| **Dashboard** with metadata | Profile created immediately (see below) |

### Dashboard user metadata (optional)

```json
{
  "team_slug": "ad",
  "role": "team_admin",
  "full_name": "Jane Doe",
  "signup_source": "admin"
}
```

- `team_slug` — required for auto-profile: `ad`, `pod-a`, `pod-b`, `pod-a-b`, `pod-b-a`, `shared`, `client-services`, `internal-ops`
- `role` — `viewer`, `member`, `team_lead`, `team_admin`
- `signup_source` — use `"admin"` so Team Lead / Team Admin roles are not downgraded to Member

## How it works (8 teams × 8 reports)

Each **Team Admin** (e.g. Ma Theint for Reputation, Ko Win Thu for Creative):

1. Signs up → selects their team → **Team Admin**
2. Adds **team members** (rows in the capacity sheet — not login accounts)
3. Fills project % allocations per member
4. Clicks **Export CSV** → one report per team (8 admins → 8 separate exports)

Team members in the sheet are **capacity rows**, not app users. Only admins need login accounts.

## Roles

| Role | View team data | Edit members sheet | Export CSV |
|------|----------------|-------------------|------------|
| `member` | Yes | No | No |
| `team_admin` | Yes | Yes | Yes |

## Teams

| Slug | Name |
|------|------|
| `reputation` | Reputation |
| `creative` | Creative |
| `strategy` | Strategy |
| `partnerships` | Partnerships |
| `campaigns` | Campaigns |
| `shared-resources` | Shared Resources |
| `client-services` | Client Services |
| `internal-ops` | Internal Operations |

### Fix existing account (no export button)

If you already signed up as `member`, run in SQL Editor:

```sql
update public.profiles
set role = 'team_admin'
where email = 'your-email@company.com';
```

Then sign out and sign in again.

## Setup

1. Run migrations in order: `001` → `002a` → `002` → `003_team_business_names_and_admin_signup.sql`
2. Copy `.env.example` → `.env` (or use the provided project keys).
3. `npm install && npm run dev`
4. Open http://localhost:5173 — use **Sign up** or create users in the Dashboard.

## Stack

React 19 · TypeScript · Vite · Tailwind · Supabase (Auth + RLS)
