import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const publicPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/[...nextauth]",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
];

function isPublicPath(path: string): boolean {
  return publicPaths.some((p) => path.startsWith(p));
}

const roleRoutes: Record<string, string[]> = {
  "/admin": ["SUPER_ADMIN"],
  "/hostel-admin": ["SUPER_ADMIN", "HOSTEL_ADMIN"],
  "/staff": ["STAFF"],
  "/student": ["STUDENT"],
};

function getRequiredRole(path: string): string[] | null {
  const sorted = Object.entries(roleRoutes).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [route, roles] of sorted) {
    if (path.startsWith(route)) {
      return roles;
    }
  }
  return null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredRoles = getRequiredRole(pathname);
  if (requiredRoles) {
    const userRole = session.user.role;
    if (!requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
