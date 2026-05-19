import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // SnagPin brand — calm purple, the screenshot reference
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        // Status colours used across pins, badges, charts
        status: {
          open: "#ef4444",       // red — open / new
          progress: "#f59e0b",   // amber — in progress
          ready: "#3b82f6",      // blue — ready for inspection
          closed: "#10b981",     // green — closed
          reopened: "#a855f7",   // purple — reopened
        },
        severity: {
          low: "#10b981",
          medium: "#f59e0b",
          high: "#ef4444",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        soft: "0 4px 24px rgba(15,23,42,0.06)",
        pop: "0 12px 40px rgba(15,23,42,0.12)",
      },
      animation: {
        "pulse-pin": "pulsePin 2s ease-out infinite",
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        pulsePin: {
          "0%": { boxShadow: "0 0 0 0 rgba(139,92,246,0.5)" },
          "70%": { boxShadow: "0 0 0 16px rgba(139,92,246,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(139,92,246,0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
