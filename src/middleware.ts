import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    // Create a response that will be used to modify cookies before returning
    const res = NextResponse.next();

    // Create Supabase client with request and response objects
    const supabase = createMiddlewareClient({ req, res });

    // Get the session without refreshing
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Debug information
    console.log("[Middleware] Path:", req.nextUrl.pathname);
    console.log("[Middleware] Session exists:", !!session);

    const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");
    const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");
    const isApiRoute = req.nextUrl.pathname.startsWith("/api");

    // If we have a session and user is on an auth page, redirect to dashboard
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If we don't have a session and user is trying to access protected routes
    if (!session && (isDashboardRoute || isApiRoute)) {
      // Store the original URL to redirect back after login
      const redirectUrl = req.nextUrl.pathname + req.nextUrl.search;
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirectTo", redirectUrl);

      return NextResponse.redirect(loginUrl);
    }

    // Return the response with updated cookies
    return res;
  } catch (error) {
    console.error("[Middleware] Error:", error);
    // On error, redirect to login for protected routes
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/api/:path*"],
};
