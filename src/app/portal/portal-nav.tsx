"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/portal", label: "Home", icon: "M3 10.5 12 3l9 7.5V21H3z" },
  { href: "/portal/calendar", label: "Content", icon: "M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4" },
  { href: "/portal/videos", label: "Videos", icon: "M4 5h16v14H4z M10 9l5 3-5 3z" },
  { href: "/portal/messages", label: "Messages", icon: "M3 5h18v13H8l-5 4z" },
  { href: "/portal/files", label: "Files", icon: "M5 3h9l5 5v13H5z M14 3v5h5" },
  { href: "/portal/announcements", label: "News", icon: "M4 5h16v14H4z M8 9h8 M8 13h8 M8 17h5" },
  { href: "/portal/payments", label: "Payments", icon: "M3 6h18v13H3z M3 10h18 M7 15h4" },
  { href: "/portal/tasks", label: "Tasks", icon: "M4 6h16 M4 12h16 M4 18h11 M17 17l2 2 3-4" },
  { href: "/portal/account", label: "Account", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0" },
];

function isActive(pathname: string, href: string) {
  return href === "/portal" ? pathname === href : pathname.startsWith(href);
}

function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

export function PortalNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [moreOpen]);

  const primary = ITEMS.slice(0, 4);
  const secondary = ITEMS.slice(4);
  const secondaryActive = secondary.some((item) => isActive(pathname, item.href));

  return (
    <>
      <nav aria-label="Client portal" className="hidden gap-1 overflow-x-auto pb-2 md:flex">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(pathname, item.href)
                ? "bg-brand/15 text-white ring-1 ring-inset ring-brand/35"
                : "text-ink/65 hover:bg-white/8 hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <nav aria-label="Client portal" className="relative grid grid-cols-5 gap-1 pb-2 md:hidden">
        {primary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition-colors",
              isActive(pathname, item.href) ? "bg-brand/15 text-white" : "text-ink/55 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon d={item.icon} />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
        <div ref={moreRef} className="relative min-w-0">
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="portal-more-menu"
            onClick={() => setMoreOpen((value) => !value)}
            className={cn(
              "flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition-colors",
              secondaryActive || moreOpen ? "bg-brand/15 text-white" : "text-ink/55 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon d="M4 7h16 M4 12h16 M4 17h16" />
            More
          </button>
          {moreOpen && (
            <div id="portal-more-menu" className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/15 bg-ink-2 p-1.5 shadow-2xl">
              {secondary.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive(pathname, item.href) ? "bg-brand/15 text-white" : "text-ink/70 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <Icon d={item.icon} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
