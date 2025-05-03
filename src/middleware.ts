import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicPaths = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
  "/api/public(.*)",
];

// Critical API paths that should always be protected
const criticalApiPaths = [
  "/api/chats",
  "/api/chats/",
  "/api/chats/new",
  "/api/threads",
  "/api/threads/",
  "/api/threads/new",
  "/api/threads/delete",
  "/api/threads/update",
  "/api/threads/get",
  "/api/threads/get-all",
  "/api/threads/get-by-id",
  "/api/threads/get-by-clerk-id",
  "/api/threads/get-by-group-name",
];

// Export the middleware
export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;
  const isDev = process.env.NODE_ENV === "development";
  const isApiRoute = path.startsWith("/api/");

  // Check if this is a critical API path that should always be protected
  const isCriticalApi = criticalApiPaths.some(
    (criticalPath) =>
      path === criticalPath || path.startsWith(`${criticalPath}/`)
  );

  // Check if this is a public path that should never require auth
  const isPublic = publicPaths.some((publicPath) => {
    if (publicPath.includes("(.*)")) {
      const basePath = publicPath.replace("(.*)", "");
      return path === basePath || path.startsWith(basePath);
    }
    return path === publicPath;
  });

  // Skip authentication for non-critical API routes in development mode
  if (isDev && isApiRoute && !isCriticalApi) {
    console.log(`[DEV] Bypassing auth for non-critical API route: ${path}`);
    return NextResponse.next();
  }

  // If the route is not public, protect it
  if (!isPublic) {
    await auth.protect();
  }

  return NextResponse.next();
});

// Configure which routes use the middleware
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|static|.*\\.(?:jpg|jpeg|gif|png|svg|ico)).*)",
    // Always run for API routes
    "/api/(.*)",
    "/trpc/(.*)",
  ],
};
