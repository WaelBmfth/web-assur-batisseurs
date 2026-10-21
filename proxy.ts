import { NextResponse, type NextRequest } from "next/server";

/**
 * Protection minimale de l'administration pour le prototype :
 * authentification HTTP Basic si la variable ADMIN_PASSWORD est définie
 * (identifiant : ADMIN_USER, « admin » par défaut).
 * La lecture GET de /api/pricing-config reste publique (utilisée par le simulateur).
 */
export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isPublicRead = pathname.startsWith("/api/pricing-config") && request.method === "GET";
  if (isPublicRead) return NextResponse.next();

  const expected = `Basic ${btoa(`${process.env.ADMIN_USER ?? "admin"}:${password}`)}`;
  if (request.headers.get("authorization") === expected) return NextResponse.next();

  return new NextResponse("Authentification requise.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Administration tarificateur", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/pricing-config/:path*"],
};
