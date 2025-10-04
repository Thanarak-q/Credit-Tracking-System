import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";

const PUBLIC_PATHS = ["/", "/login", "/api/auth/login", "/api/auth/register", "/_next", "/favicon.ico", "/public"] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirectTo", pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api/auth/login|_next/static|_next/image|favicon.ico|assets|public).*)",
};
