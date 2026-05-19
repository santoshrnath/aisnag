"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Camera, MapPin } from "lucide-react";

const KEY = "snagpin.onboarding.v1";

// Friendly first-visit hint card. Renders once per browser, dismissable.
// Pinned to the top of the dashboard so partners landing on the demo see
// "this is what to try" before they hunt for it.
export function OnboardingHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (localStorage.getItem(KEY) === "1") return;
      setShow(true);
    } catch {
      // localStorage blocked — silently skip the hint.
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-brand-50 px-4 py-4 shadow-card lg:px-5 lg:py-5 animate-fade-in">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-brand-300/20 blur-3xl" />

      <button
        onClick={dismiss}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-brand-700/60 hover:bg-brand-100 hover:text-brand-700"
        aria-label="Dismiss hint"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-brand-900">
            Try SnagPin in 30 seconds
          </div>
          <p className="mt-1 text-xs leading-relaxed text-brand-900/70">
            Open a drawing, tap to drop a pin, add a photo —{" "}
            <span className="font-medium text-brand-700">Claude drafts the snag for you</span>.
            Or type a question into the search bar like <em>"paint defects near windows"</em>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/drawings"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <MapPin className="h-3.5 w-3.5" />
              Open a drawing
            </Link>
            <Link
              href="/snags/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              <Camera className="h-3.5 w-3.5" />
              Try photo-to-snag
            </Link>
            <button
              onClick={dismiss}
              className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-brand-700/70 hover:text-brand-800"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
