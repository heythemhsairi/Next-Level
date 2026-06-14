"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/portal", label: "Home" },
  { href: "/portal/videos", label: "My Videos" },
  { href: "/portal/messages", label: "Messages" },
  { href: "/portal/files", label: "Files" },
  { href: "/portal/announcements", label: "News" },
  { href: "/portal/payments", label: "Payments" },
  { href: "/portal/tasks", label: "Tasks" },
  { href: "/portal/account", label: "Account" },
];

function isActive(pathname: string, href: string) {
  if (href === "/portal") return pathname === "/portal";
  return pathname.startsWith(href);
}

export function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-2">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              active
                ? "bg-gradient-to-r from-brand/95 to-brand-dark/95 text-white shadow-brand-glow"
                : "text-ink/65 hover:bg-white/8 hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
