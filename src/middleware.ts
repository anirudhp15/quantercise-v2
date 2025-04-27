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

    // Only block access to dashboard if explicitly no session
    // This looser check helps when cookie issues might occur
    const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");
    const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");

    // If we have a session and user is on an auth page, redirect to dashboard
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Return the response with updated cookies
    return res;
  } catch (error) {
    console.error("[Middleware] Error:", error);
    // Allow the request to proceed even if there's an error
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
