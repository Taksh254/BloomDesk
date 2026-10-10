import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookie";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/setup"];

// A quick first check before any page renders: visitors without a session cookie go to
// login. The cookie is checked against the database by requireSchool() on every page
// and Server Action, so a stale or forged cookie gets no further than this.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!process.env.DATABASE_URL) {
    if (pathname.startsWith("/setup")) return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!token) {
    if (isPublic) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Keep the cookie alive while the person keeps using the app.
  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
