"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  ListChecks,
  PinIcon,
  BarChart3,
  ClipboardCheck,
  Users,
  Settings,
  Menu,
  X,
  Plus,
  Home,
  Search,
  Bell,
  MoreHorizontal,
  FolderOpen,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { AuthBadge } from "@/components/shell/AuthBadge";
import { ProjectSwitcher } from "@/components/shell/ProjectSwitcher";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: number;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drawings", label: "Drawings", icon: Map },
  { href: "/snags", label: "Snags", icon: PinIcon },
  { href: "/tasks", label: "My Tasks", icon: ListChecks },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck },
  { href: "/team", label: "Team", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_TABS: NavItem[] = [
  { href: "/drawings", label: "Drawings", icon: Map },
  { href: "/snags", label: "Snags", icon: PinIcon },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

interface AppShellProps {
  children: ReactNode;
  projectId?: string | null;
  projectName?: string;
  projectClient?: string | null;
  userName?: string;
  userRole?: string;
  /** Hide the chrome (used on full-bleed pages like the drawing canvas) */
  bareMobile?: boolean;
}

export function AppShell({
  children,
  projectId = null,
  projectName = "Skyline Residences",
  projectClient = null,
  userName = "Arjun Sharma",
  userRole = "Site Engineer",
  bareMobile = false,
}: AppShellProps) {
  const [openSheet, setOpenSheet] = useState(false);
  const path = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-ink-900">
      {/* DESKTOP sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <Logo />
        </div>
        <div className="mb-5">
          <ProjectSwitcher
            currentId={projectId}
            currentName={projectName}
            currentClient={projectClient}
          />
        </div>
        <nav className="flex-1 space-y-0.5">
          {NAV.map((item) => {
            const active = path === item.href || (item.href !== "/" && path?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-ink-900",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px]",
                      active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                  {item.label}
                </span>
                {item.badge != null && (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4">
          <AuthBadge demoName={userName} demoRole={userRole} />
        </div>
      </aside>

      {/* MOBILE top bar */}
      <header
        className={cn(
          "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden",
          bareMobile && "hidden",
        )}
      >
        <button
          onClick={() => setOpenSheet(true)}
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo compact />
        <Link
          href="/snags/new"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white"
          aria-label="New snag"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </header>

      {/* MAIN */}
      <main className={cn("min-h-screen lg:pl-64", !bareMobile && "pb-20 lg:pb-0")}>
        {children}
      </main>

      {/* MOBILE bottom tabs */}
      {!bareMobile && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-safe lg:hidden">
          <div className="grid grid-cols-5 px-2 pt-2">
            {MOBILE_TABS.slice(0, 2).map((tab) => (
              <TabLink key={tab.href} tab={tab} active={path?.startsWith(tab.href) ?? false} />
            ))}
            <div className="flex items-center justify-center">
              <Link
                href="/snags/new"
                className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-pop transition active:scale-95"
                aria-label="New snag"
              >
                <Plus className="h-7 w-7" />
              </Link>
            </div>
            {MOBILE_TABS.slice(2).map((tab) => (
              <TabLink key={tab.href} tab={tab} active={path?.startsWith(tab.href) ?? false} />
            ))}
          </div>
        </nav>
      )}

      {/* MOBILE drawer */}
      {openSheet && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpenSheet(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[82%] max-w-[320px] bg-white p-5 shadow-pop animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setOpenSheet(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <ProjectSwitcher
                currentId={projectId}
                currentName={projectName}
                currentClient={projectClient}
              />
            </div>
            <nav className="space-y-0.5">
              {NAV.map((item) => {
                const active = path === item.href || (item.href !== "/" && path?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenSheet(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px]", active ? "text-brand-600" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6">
              <AuthBadge demoName={userName} demoRole={userRole} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
        <PinIcon className="h-4 w-4 text-white" strokeWidth={2.5} fill="white" />
      </div>
      {!compact && <span className="text-lg font-semibold tracking-tight text-ink-900">SnagPin</span>}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
      {initials(name)}
    </div>
  );
}

function TabLink({ tab, active }: { tab: NavItem; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      className={cn(
        "flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium",
        active ? "text-brand-700" : "text-slate-500",
      )}
    >
      <Icon className={cn("h-[20px] w-[20px]", active ? "text-brand-600" : "text-slate-500")} />
      <span>{tab.label}</span>
    </Link>
  );
}

export { Search, Bell, MoreHorizontal };
