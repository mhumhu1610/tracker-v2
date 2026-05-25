# Fix: “Email rate limit exceeded”

Supabase sends an email on every **sign up**, **password reset**, and **email change**. Free projects have a **low hourly limit** (~2–4 emails/hour). Repeated sign-up attempts trigger this error.

## Fastest fix (development)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. **Authentication** → **Providers** → **Email**  
3. Turn **OFF** → **Confirm email**  
4. Save  

New sign-ups get a session immediately (no confirmation email). Sign up or sign in again in the app.

## If you already registered

Do **not** sign up again. Use **Sign in** with the same email and password.

If login fails with “email not confirmed”, either:

- Confirm the link in your inbox (if one was sent earlier), or  
- In Dashboard → **Authentication** → **Users** → open the user → **Confirm user** / auto-confirm.

## Create admins without email (Dashboard)

1. **Authentication** → **Users** → **Add user**  
2. Email + password  
3. Check **Auto Confirm User**  
4. User metadata (optional):

```json
{
  "team_slug": "reputation",
  "role": "team_admin",
  "full_name": "Ma Theint",
  "signup_source": "admin"
}
```

5. User signs in in the app (no email sent).

## Production

- Use **custom SMTP** (Authentication → SMTP) for higher limits  
- Or keep confirm email on and avoid repeated test sign-ups with the same address  

## Upgrade existing user to Team Admin (SQL)

```sql
update public.profiles
set role = 'team_admin'
where email = 'admin@yourcompany.com';
```
