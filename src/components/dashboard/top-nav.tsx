"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { cn, type AnyUserRole } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { Avatar } from "@/components/avatar";
import { NotificationBell, type NotificationRow } from "./notification-bell";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  rolesAllowed: AnyUserRole[];
  icon: string;
};

// Refreshed icon set — rounded grid/box style for a distinct new look.
const ICONS: Record<string, string> = {
  overview: "M4 4h7v7H4z M13 4h7v4h-7z M13 11h7v9h-7z M4 13h7v7H4z",
  tasks: "M4 5h16 M4 12h16 M4 19h10 M19 17l2 2 3-4",
  deliverables:
    "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M10 8.5l5 3.5-5 3.5z",
  projects:
    "M3 8a2 2 0 0 1 2-2h3l2-2h4a2 2 0 0 1 2 2 M3 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  calendar:
    "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z M4 9h16 M8 3v3 M16 3v3 M8 13h2v2H8z",
  socialMedia:
    "M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M17 6.5h.01",
  leads: "M3 17l5-5 4 4 9-9 M21 7v5h-5",
  clients:
    "M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2 20a6 6 0 0 1 12 0 M17 10a3 3 0 1 0 0-6 M16 20a5 5 0 0 1 6-2",
  devis:
    "M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M14 3v6h6 M9 13h6 M9 17h6",
  factures:
    "M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M14 3v6h6 M9 14l2 2 4-4",
  finance: "M4 19V5 M4 19h16 M8 16v-5 M12 16V8 M16 16v-3",
  services: "M4 7h16 M4 12h16 M4 17h10",
  team: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M3 20a6 6 0 0 1 12 0 M16 4a3.5 3.5 0 0 1 0 7 M17 20a6 6 0 0 0-3-5",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 13a1.65 1.65 0 0 0 .33 1.82l.05.06a2 2 0 1 1-2.83 2.83l-.06-.05a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33l-.06.05a2 2 0 1 1-2.83-2.83l.05-.06A1.65 1.65 0 0 0 2.6 14 1.65 1.65 0 0 0 1 12.6V12a2 2 0 0 1 4 0",
  messages:
    "M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z",
  files:
    "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M13 2v7h7",
  analytics: "M4 20V10 M10 20V4 M16 20v-7 M20 20H2",
  announcements:
    "M3 11v2a1 1 0 0 0 1 1h2l4 4V7L6 11H4a1 1 0 0 0-1 0z M14 8a4 4 0 0 1 0 8 M16 5a7 7 0 0 1 0 14",
};

function buildNav(t: ReturnType<typeof useI18n>["t"]): NavItem[] {
  const editors: AnyUserRole[] = ["admin", "editor", "worker", "freelancer"];
  const all: AnyUserRole[] = [
    "admin",
    "editor",
    "sales",
    "worker",
    "freelancer",
  ];
  const salesRoles: AnyUserRole[] = ["admin", "sales"];
  return [
    { href: "/dashboard", label: t.nav.overview, icon: ICONS.overview, rolesAllowed: all },
    { href: "/dashboard/tasks", label: t.nav.tasks, icon: ICONS.tasks, rolesAllowed: editors },
    { href: "/dashboard/deliverables", label: t.nav.deliverables, icon: ICONS.deliverables, rolesAllowed: editors },
    { href: "/dashboard/projects", label: t.nav.projects, icon: ICONS.projects, rolesAllowed: all },
    { href: "/dashboard/calendar", label: t.nav.calendar, icon: ICONS.calendar, rolesAllowed: editors },
    { href: "/dashboard/messages", label: t.nav.messages, icon: ICONS.messages, rolesAllowed: all },
    { href: "/dashboard/files", label: t.nav.files, icon: ICONS.files, rolesAllowed: all },
    { href: "/dashboard/announcements", label: t.nav.announcements, icon: ICONS.announcements, rolesAllowed: all },
    { href: "/dashboard/social-media", label: t.nav.socialMedia, icon: ICONS.socialMedia, rolesAllowed: ["admin", "editor", "worker"] },
    { href: "/dashboard/leads", label: t.nav.leads, icon: ICONS.leads, rolesAllowed: salesRoles },
    { href: "/dashboard/clients", label: t.nav.clients, icon: ICONS.clients, rolesAllowed: salesRoles },
    { href: "/dashboard/devis", label: t.nav.devis, icon: ICONS.devis, rolesAllowed: salesRoles },
    { href: "/dashboard/factures", label: t.nav.factures, icon: ICONS.factures, rolesAllowed: salesRoles },
    { href: "/dashboard/finance", label: t.nav.finance, icon: ICONS.finance, rolesAllowed: salesRoles },
    { href: "/dashboard/analytics", label: t.nav.analytics, icon: ICONS.analytics, rolesAllowed: ["admin", "sales"] },
    { href: "/dashboard/services", label: t.nav.services, icon: ICONS.services, rolesAllowed: ["admin"] },
    { href: "/dashboard/team", label: t.nav.team, icon: ICONS.team, rolesAllowed: ["admin"] },
    { href: "/dashboard/settings", label: t.nav.settings, icon: ICONS.settings, rolesAllowed: ["admin"] },
  ];
}

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  return pathname.startsWith(href);
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

export function TopNav({
  role,
  username,
  avatarUrl,
  jobTitle,
  notifications,
}: {
  role: AnyUserRole;
  username: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  notifications: NotificationRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  const items = buildNav(t).filter((i) => i.rolesAllowed.includes(role));

  function onSignOut() {
    startSignOut(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/65 backdrop-blur-2xl">
      <div className="mx-auto flex h-[60px] w-full max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/dashboard" className="group flex shrink-0 items-center">
          <BrandLogo width={118} className="transition-transform duration-200 group-hover:scale-[1.02]" />
        </Link>

        {/* Search */}
        <button
          type="button"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("nl:open-search"))
          }
          className="group hidden h-9 min-w-[200px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-ink/45 transition-colors hover:border-brand/40 hover:bg-white/[0.07] md:flex"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-ink/40">
            ⌘K
          </kbd>
        </button>

        {/* Horizontal nav (desktop) */}
        <nav className="hidden flex-1 items-center gap-0.5 overflow-x-auto xl:flex">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-brand/90 to-brand-dark/90 text-white shadow-brand-glow"
                    : "text-ink/60 hover:bg-white/[0.06] hover:text-ink",
                )}
              >
                <NavIcon d={item.icon} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 xl:flex-none">
          <NotificationBell initial={notifications} />
          <Link
            href="/dashboard/profile"
            className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-1 py-1 pr-3 transition-all duration-150 hover:border-brand/40 hover:bg-white/[0.08]"
          >
            <Avatar src={avatarUrl} name={username} size="sm" />
            <div className="hidden text-xs leading-tight sm:block">
              <p className="font-semibold text-ink">@{username}</p>
              <p className="text-ink/50">{jobTitle ?? t.roles[role]}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            title={t.nav.logout}
            aria-label={t.nav.logout}
            className="hidden shrink-0 rounded-lg p-2 text-ink/45 transition-colors hover:bg-white/[0.06] hover:text-ink disabled:opacity-50 sm:block"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
            </svg>
          </button>
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-lg p-2 text-ink/70 hover:bg-white/[0.06] xl:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <nav className="grid grid-cols-2 gap-1 border-t border-white/8 px-4 py-3 sm:grid-cols-3 xl:hidden">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-brand/90 to-brand-dark/90 text-white"
                    : "text-ink/65 hover:bg-white/[0.06] hover:text-ink",
                )}
              >
                <NavIcon d={item.icon} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
