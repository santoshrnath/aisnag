import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name?: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function timeAgo(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} wk${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo${months === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

export function formatDate(d?: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function statusLabel(s: string): string {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function statusColor(s: string): { bg: string; text: string; pin: string } {
  switch (s) {
    case "OPEN":
      return { bg: "bg-red-50", text: "text-red-700", pin: "#ef4444" };
    case "IN_PROGRESS":
      return { bg: "bg-amber-50", text: "text-amber-700", pin: "#f59e0b" };
    case "READY_FOR_INSPECTION":
      return { bg: "bg-blue-50", text: "text-blue-700", pin: "#3b82f6" };
    case "CLOSED":
      return { bg: "bg-emerald-50", text: "text-emerald-700", pin: "#10b981" };
    case "REOPENED":
      return { bg: "bg-purple-50", text: "text-purple-700", pin: "#a855f7" };
    case "CANCELLED":
      return { bg: "bg-slate-100", text: "text-slate-600", pin: "#94a3b8" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600", pin: "#94a3b8" };
  }
}

export function severityColor(s: string): { bg: string; text: string; dot: string } {
  switch (s) {
    case "COSMETIC":
      return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
    case "FUNCTIONAL":
      return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
    case "SAFETY":
      return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  }
}

export function priorityColor(s: string): { bg: string; text: string } {
  switch (s) {
    case "HIGH":
      return { bg: "bg-red-50", text: "text-red-700" };
    case "MEDIUM":
      return { bg: "bg-amber-50", text: "text-amber-700" };
    case "LOW":
      return { bg: "bg-emerald-50", text: "text-emerald-700" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600" };
  }
}
