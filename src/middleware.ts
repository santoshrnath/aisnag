import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public surface — everything else routes through Clerk's auth handlers.
// We deliberately do NOT block the dashboard or drawing canvas so visitors
// can SEE the demo without logging in. Cost-bearing API routes (AI
// photo/voice, semantic search) enforce `auth()` inside the handler and
// return 401 if the caller isn't signed in.
const isPublicRoute = createRouteMatcher([
  "/",
  "/drawings",
  "/drawings/(.*)",
  "/snags",
  "/snags/(.*)",
  "/tasks",
  "/reports",
  "/team",
  "/inspections",
  "/settings",
  "/api/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files; always include API routes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
