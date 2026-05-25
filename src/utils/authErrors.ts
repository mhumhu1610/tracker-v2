export function formatAuthError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "Something went wrong";

  const lower = message.toLowerCase();

  if (
    lower.includes("email rate limit") ||
    lower.includes("rate limit exceeded") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return (
      "Supabase email rate limit reached (too many sign-up or reset emails). " +
      "Wait about 1 hour, sign in if you already have an account, or turn off " +
      '"Confirm email" in Supabase → Authentication → Providers → Email.'
    );
  }

  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "This email is already registered. Use Sign in instead.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Wrong email or password. If you just signed up, confirm your email first—or disable email confirmation in Supabase for development.";
  }

  if (lower.includes("email not confirmed")) {
    return (
      "Email not confirmed yet. Check your inbox, or disable " +
      '"Confirm email" in Supabase for instant access during development.'
    );
  }

  return message;
}
