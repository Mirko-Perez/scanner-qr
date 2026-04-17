import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-edge";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/seed",
  "/api/auth/logout",
  "/recuerdos",
  "/display",
  "/llegada",
  "/api/scan",
  "/api/events",
  "/api/memories",
  "/api/upload-video",
];

// Paths that require SUPERADMIN role
const ADMIN_PATHS = ["/admin", "/api/tables", "/api/guests", "/api/stats"];

function isPublicPath(pathname: string): boolean {
  // Static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.includes(".")
  ) {
    return true;
  }

  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root redirects
  if (pathname === "/") {
    const token = request.cookies.get("auth-token")?.value;
    if (token) {
      const user = await verifyToken(token);
      if (user?.role === "SUPERADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/recuerdos", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await verifyToken(token);

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
    return response;
  }

  // Admin paths require SUPERADMIN
  if (isAdminPath(pathname) && user.role !== "SUPERADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/recuerdos", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)",
  ],
};
