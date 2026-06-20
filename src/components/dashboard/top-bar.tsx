"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { NotificationBell, type NotificationRow } from "./notification-bell";
import { MobileSideNav } from "./side-nav";
import type { AnyUserRole } from "@/lib/utils";
import type { NavCounts } from "@/lib/nav-counts";

/**
 * Slim top bar that pairs with the left SideNav: a global search trigger,
 * notifications, and (on mobile) the brand + a menu button that opens the
 * sidebar drawer. The sidebar owns primary nav + the user card.
 */
export function TopBar({
  role,
  notifications,
  counts,
}: {
  role: AnyUserRole;
  notifications: NotificationRow[];
  counts?: NavCounts;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-white/8 bg-ink/55 px-4 backdrop-blur-2xl sm:px-6">
      {/* Mobile: menu + brand */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Menu"
        className="rounded-lg p-2 text-ink/70 hover:bg-white/[0.06] lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <div className="lg:hidden">
        <BrandLogo width={104} />
      </div>

      {/* Search (grows to fill) */}
      <button
        type="button"
        onClick={() => document.dispatchEvent(new CustomEvent("nl:open-search"))}
        className="group hidden h-9 max-w-md flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-ink/45 transition-colors hover:border-brand/40 hover:bg-white/[0.07] md:flex"
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

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell initial={notifications} />
      </div>

      <MobileSideNav role={role} open={menuOpen} onClose={() => setMenuOpen(false)} counts={counts} />
    </header>
  );
}
