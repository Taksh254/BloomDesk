// Shared by proxy.ts and the session code, so it must not import the database.

export const SESSION_COOKIE = "bd_session";
export const SESSION_DAYS = 30;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
