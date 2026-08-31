import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The cookie set by the backend upon successful admin login
  const hasAdminCookie = request.cookies.has("fxnod_admin_refresh");

  // Redirect root to dashboard (or login if not authenticated)
  if (pathname === "/") {
    if (hasAdminCookie) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Protect all /admin/* routes EXCEPT the login page
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!hasAdminCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // If logged in, prevent accessing the login page
  if (pathname.startsWith("/admin/login")) {
    if (hasAdminCookie) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to root and all /admin paths
  matcher: ["/", "/admin/:path*"],
};
