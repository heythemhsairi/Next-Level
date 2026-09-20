import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SideNav } from "@/components/dashboard/side-nav";
import { TopBar } from "@/components/dashboard/top-bar";
import { CommandPalette } from "@/components/command-palette";
import type { NotificationRow } from "@/components/dashboard/notification-bell";
import { getNavCounts, type NavCounts } from "@/lib/nav-counts";

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

  // Live sidebar badge counts (role-gated; failures degrade to 0).
  let navCounts: NavCounts | undefined;
  try {
    navCounts = await getNavCounts(session.role, session.id);
  } catch (err) {
    console.error("[layout:navCounts]", err);
  }

  return (
    <div className="min-h-screen">
      {/* A quiet red tint preserves depth without competing with the data. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-brand/10 blur-[140px]" />
        <div className="absolute right-[-12rem] top-1/4 h-[28rem] w-[28rem] rounded-full bg-brand-light/[0.05] blur-[130px]" />
      </div>

      {/* Fixed left sidebar (desktop) — brand + grouped nav + user. */}
      <SideNav
        role={session.role}
        username={session.username}
        avatarUrl={session.avatar_url}
        jobTitle={session.job_title}
        counts={navCounts}
      />

      {/* Content column, offset by the sidebar on desktop. */}
      <div className="lg:pl-[252px]">
        <TopBar role={session.role} notifications={notifications} counts={navCounts} />
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
