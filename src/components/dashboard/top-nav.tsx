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

const ICONS: Record<string, string> = {
  overview: "M3 12l2-2 2 2 3-3 3 3 5-5v8H3z",
  tasks: "M3 6h2l1 2h13M3 12h18M3 18h18",
  deliverables:
    "M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4z M10 9l5 3-5 3z",
  projects:
    "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z",
  calendar:
    "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z M16 3v4 M8 3v4 M3 11h18",
  socialMedia:
    "M4 4m0 4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M17.5 6.5h.01",
  leads: "M22 12h-4l-3 9L9 3l-3 9H2",
  clients:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  devis:
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z M14 2v6h6 M16 13H8 M16 17H8",
  factures:
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z M14 2v6h6 M9 12l2 2 4-4",
  finance: "M3 3v18h18 M7 14l4-4 4 4 5-5",
  services: "M20 7l-9 9-5-5",
  team: "M17 21v-2a4 4 0 0 0-3-3.87 M9 21v-2a4 4 0 0 1 3-3.87 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 2v3 M12 19v3 M4.22 4.22l2.12 2.12 M17.66 17.66l2.12 2.12 M2 12h3 M19 12h3 M4.22 19.78l2.12-2.12 M17.66 6.34l2.12-2.12",
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
    { href: "/dashboard/social-media", label: t.nav.socialMedia, icon: ICONS.socialMedia, rolesAllowed: ["admin", "editor", "worker"] },
    { href: "/dashboard/leads", label: t.nav.leads, icon: ICONS.leads, rolesAllowed: salesRoles },
    { href: "/dashboard/clients", label: t.nav.clients, icon: ICONS.clients, rolesAllowed: salesRoles },
    { href: "/dashboard/devis", label: t.nav.devis, icon: ICONS.devis, rolesAllowed: salesRoles },
    { href: "/dashboard/factures", label: t.nav.factures, icon: ICONS.factures, rolesAllowed: salesRoles },
    { href: "/dashboard/finance", label: t.nav.finance, icon: ICONS.finance, rolesAllowed: salesRoles },
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

        {/* Horizontal nav (desktop) */}
        <nav className="hidden flex-1 items-center gap-0.5 overflow-x-auto lg:flex">
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

        <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
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
            className="rounded-lg p-2 text-ink/70 hover:bg-white/[0.06] lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <nav className="grid grid-cols-2 gap-1 border-t border-white/8 px-4 py-3 sm:grid-cols-3 lg:hidden">
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
