import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Gate for cost-bearing endpoints (Anthropic calls, vector upserts, etc.).
// Returns `null` if the visitor is signed in — handler proceeds.
// Returns a 401 JSON response if anonymous — handler should return it.
export async function requireSignedIn(): Promise<NextResponse | null> {
  try {
    const { userId } = await auth();
    if (userId) return null;
  } catch {
    // auth() throws when Clerk env vars aren't set — treat as open in dev.
    return null;
  }
  return NextResponse.json(
    {
      error:
        "Sign in to use this feature. AI photo-to-snag, voice-to-snag and semantic search use Anthropic credits and are gated to signed-in users.",
      code: "auth_required",
    },
    { status: 401 },
  );
}

// Returns true if Clerk is wired up at runtime. Used by client-side UI
// to decide whether to surface sign-in CTAs at all (so the OSS demo
// stays useful even when there are no Clerk keys present).
export function clerkConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}
