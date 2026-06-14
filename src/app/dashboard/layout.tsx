import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SideNav } from "@/components/dashboard/side-nav";
import { TopBar } from "@/components/dashboard/top-bar";
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

      {/* Fixed left sidebar (desktop) — brand + grouped nav + user. */}
      <SideNav
        role={session.role}
        username={session.username}
        avatarUrl={session.avatar_url}
        jobTitle={session.job_title}
      />

      {/* Content column, offset by the sidebar on desktop. */}
      <div className="lg:pl-[252px]">
        <TopBar role={session.role} notifications={notifications} />
        <main className="reveal px-4 py-7 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1280px] space-y-8">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
