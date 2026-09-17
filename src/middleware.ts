import { NextRequest, NextResponse } from "next/server";

// Helper to decode JWT payload in Edge runtime without external dependencies
function parseJwtPayload(token: string): { userId?: string; email?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;
  const payload = token ? parseJwtPayload(token) : null;

  // Check token expiration
  const isExpired = payload?.exp ? Date.now() >= payload.exp * 1000 : false;
  const user = payload && !isExpired ? payload : null;

  // 1. Admin Routes: Only SUPER_ADMIN, MODERATOR, FINANCE_ADMIN
  if (pathname.startsWith("/admin")) {
    const allowedRoles = ["SUPER_ADMIN", "MODERATOR", "FINANCE_ADMIN"];
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("auth_error", "unauthorized_admin");
      return NextResponse.redirect(url);
    }
  }

  // 2. Author Studio Routes: Only AUTHOR, SUPER_ADMIN
  if (pathname.startsWith("/author") && !pathname.startsWith("/author/apply")) {
    // Note: /author/apply or public /author/[id] can be accessed, but /author dashboard requires AUTHOR or SUPER_ADMIN
    // If it's the author dashboard or stories manager:
    const isStudioRoute =
      pathname === "/author" ||
      pathname.startsWith("/author/stories") ||
      pathname.startsWith("/author/dashboard");

    if (isStudioRoute) {
      const allowedRoles = ["AUTHOR", "SUPER_ADMIN"];
      if (!user || !user.role || !allowedRoles.includes(user.role)) {
        const url = req.nextUrl.clone();
        if (!user) {
          url.pathname = "/";
          url.searchParams.set("auth_modal", "LOGIN");
          url.searchParams.set("auth_error", "unauthorized_author");
        } else {
          // Authenticated reader -> redirect directly to the author application form
          url.pathname = "/author/apply";
        }
        return NextResponse.redirect(url);
      }
    }
  }

  // 3. User Protected Routes: Profile, Wallet
  if (pathname.startsWith("/profile") || pathname.startsWith("/wallet")) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("auth_modal", "LOGIN");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/author/:path*",
    "/profile/:path*",
    "/wallet/:path*",
  ],
};
