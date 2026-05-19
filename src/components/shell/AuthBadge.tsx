"use client";

// Sign-in / user-button slot in the app shell. Self-aware: if Clerk isn't
// configured (no NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY at build time) it
// renders a static "Demo user" pill so the OSS demo stays usable without
// any auth keys.

import { LogIn } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { initials } from "@/lib/utils";

interface Props {
  /** Static demo profile to show when Clerk isn't configured. */
  demoName: string;
  demoRole: string;
}

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AuthBadge({ demoName, demoRole }: Props) {
  if (!clerkConfigured) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
          {initials(demoName)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-900">{demoName}</div>
          <div className="truncate text-xs text-slate-500">{demoRole} · demo</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <UserButton
            appearance={{ elements: { avatarBox: "h-9 w-9" } }}
          />
          <div className="min-w-0 flex-1 text-xs text-slate-500">Signed in</div>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="space-y-2">
          <SignInButton mode="modal">
            <button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="flex h-10 w-full items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700">
              Create account
            </button>
          </SignUpButton>
        </div>
      </SignedOut>
    </>
  );
}
