import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileNav } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { CommandPalette } from "@/components/command-palette";
import type { NotificationRow } from "@/components/dashboard/notification-bell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  // Fetch the latest 20 notifications for the bell. The bell badge reads
  // unread count from this list; older notifications stay accessible but
  // not loaded at first paint.
  let notifications: NotificationRow[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, body, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    notifications = (data ?? []) as NotificationRow[];
  } catch (err) {
    console.error("[layout:notifications]", err);
  }

  return (
    <div className="min-h-screen">
      {/*
        Decorative background — a fixed, viewport-sized layer of soft purple
        glow over the near-black base. Stays put while scrolling; clips its
        own blurred blobs.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute -left-40 -top-40 h-[40rem] w-[40rem] rounded-full bg-brand/25 blur-[130px]" />
        <div className="absolute right-[-12rem] top-1/4 h-[30rem] w-[30rem] rounded-full bg-brand-light/15 blur-[120px]" />
        <div className="absolute -bottom-48 left-1/3 h-[34rem] w-[34rem] rounded-full bg-brand-dark/25 blur-[130px]" />
      </div>

      {/* Full-height fixed sidebar (desktop). Owns brand + nav + user. */}
      <Sidebar
        role={session.role}
        username={session.username}
        avatarUrl={session.avatar_url}
        jobTitle={session.job_title}
      />

      {/* Mobile top nav (sidebar is hidden on small screens). */}
      <MobileNav role={session.role} />

      {/* Content column is offset by the sidebar width on desktop. */}
      <div className="md:pl-[260px]">
        <Topbar notifications={notifications} />
        <main className="reveal min-w-0 px-4 py-6 sm:px-6 md:px-10 md:py-9">
          <div className="mx-auto w-full max-w-[1200px] space-y-8">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
