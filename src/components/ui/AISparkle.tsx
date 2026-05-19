"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  className?: string;
}

// Animated "drafted by Claude" chip. Used on AI-generated snags + the
// AI-inspected button after the user confirms a draft. The motion is
// subtle — a slow shimmer across the gradient — so it adds delight
// without ever pulling focus from the snag content itself.
export function AISparkle({ label = "Drafted by Claude", className }: Props) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative inline-flex items-center gap-1 overflow-hidden rounded-full border border-brand-200/70 bg-gradient-to-r from-brand-50 via-white to-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700",
        className,
      )}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-brand-200/60 to-transparent"
        style={{ width: "40%" }}
        animate={{ x: ["-60%", "260%"] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
      />
      <Sparkles className="h-3 w-3" />
      {label}
    </motion.span>
  );
}
