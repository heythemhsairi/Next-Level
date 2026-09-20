import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ContentCalendar, type CalendarPost } from "@/components/content-calendar";

export const dynamic = "force-dynamic";

export default async function PortalCalendarPage() {
  await requireClient();
  const supabase = await createClient();

  // RLS (social_posts_client_select) restricts this to client-visible posts on
  // projects owned by the signed-in client; the explicit filter is belt-and-braces.
  const { data, error } = await supabase
    .from("social_posts")
    .select(
      "id, title, content, platforms, status, scheduled_at, projects:project_id(name)",
    )
    .eq("client_visible", true)
    .order("scheduled_at", { ascending: true });

  if (error?.code === "42703") {
    return (
      <section className="rounded-2xl border border-white/10 bg-ink-2 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-light">Content</p>
        <h1 className="mt-3 text-2xl font-display font-bold text-white">Your calendar is being prepared</h1>
        <p className="mt-2 text-sm text-white/60">Your studio will make your content plan available here soon.</p>
      </section>
    );
  }
  if (error) throw new Error("Content calendar could not be loaded.");

  const posts: CalendarPost[] = (data ?? []).map((p) => {
    const proj = Array.isArray(p.projects) ? p.projects[0] : p.projects;
    return {
      id: p.id,
      title: p.title,
      content: p.content ?? "",
      platforms: (p.platforms as string[] | null) ?? [],
      status: p.status,
      scheduledAt: p.scheduled_at,
      projectName: proj?.name ?? null,
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
          Content
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-cream">
          Content calendar
        </h1>
        <p className="mt-1 text-sm text-cream/55">
          Your upcoming and published content, month by month. Tap any item for
          details.
        </p>
      </div>
      <ContentCalendar posts={posts} />
    </div>
  );
}
