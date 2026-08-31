import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env/public";

const PROTECTED_ROUTES = ["/list", "/achievements", "/settings", "/admin"];

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

const ADMIN_HOST_PATTERN = /^admin\.sodoit\.cc(:\d+)?$/;

export async function proxy(request: NextRequest) {
  const isAdminHost = ADMIN_HOST_PATTERN.test(
    request.headers.get("host") ?? "",
  );
  const originalPathname = request.nextUrl.pathname;
  const pathname =
    isAdminHost && !originalPathname.startsWith("/admin")
      ? `/admin${originalPathname === "/" ? "" : originalPathname}`
      : originalPathname;

  if (!isProtectedRoute(pathname)) {
    if (pathname !== originalPathname) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = pathname;
      return NextResponse.rewrite(rewriteUrl, { request });
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();

  const isAuthenticated = !error && Boolean(data?.claims?.sub);

  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    const next = pathname + request.nextUrl.search;

    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(next)}`;

    return NextResponse.redirect(loginUrl);
  }

  if (pathname !== originalPathname) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname;

    const rewritten = NextResponse.rewrite(rewriteUrl, { request });
    response.cookies
      .getAll()
      .forEach((cookie) => rewritten.cookies.set(cookie));

    return rewritten;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
