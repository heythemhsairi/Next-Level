import { requireWorkerOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SocialMediaView, type SocialPost } from "./social-media-view";

export default async function SocialMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ task_id?: string }>;
}) {
  await requireWorkerOrAdmin();
  const supabase = await createClient();
  const { task_id: preselectedTaskId } = await searchParams;

  const [postsResult, projectsResult, tasksResult] =
    await Promise.all([
      supabase
        .from("social_posts")
        .select(
          "id, title, content, platforms, status, scheduled_at, published_at, media_url, hashtags, first_comment, notes, client_visible, project_id, task_id, created_by, created_at, projects:project_id(name), tasks:task_id(title), profiles:created_by(full_name, username)",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("id, name")
        .order("name", { ascending: true }),
      supabase
        .from("tasks")
        .select("id, title, project_id")
        .is("parent_task_id", null)
        .order("title", { ascending: true }),
    ]);

  if (postsResult.error?.code === "42703") {
    return (
      <section className="rounded-2xl border border-white/10 bg-ink-2 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-light">Social Media</p>
        <h1 className="mt-3 text-2xl font-display font-bold text-white">Content planning is being prepared</h1>
        <p className="mt-2 text-sm text-white/60">Finish the database setup before editing content or sharing it with clients.</p>
      </section>
    );
  }
  if (postsResult.error || projectsResult.error || tasksResult.error) {
    throw new Error("Social media data could not be loaded.");
  }

  const postsRaw = postsResult.data;
  const projectsRaw = projectsResult.data;
  const tasksRaw = tasksResult.data;

  const posts: SocialPost[] = (postsRaw ?? []).map((p) => {
    const proj = Array.isArray(p.projects) ? p.projects[0] : p.projects;
    const task = Array.isArray(p.tasks) ? p.tasks[0] : p.tasks;
    const creator = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    return {
      id: p.id,
      title: p.title,
      content: p.content,
      platforms: (p.platforms as string[] | null) ?? [],
      status: p.status,
      scheduled_at: p.scheduled_at,
      published_at: p.published_at,
      media_url: p.media_url,
      hashtags: p.hashtags ?? "",
      first_comment: p.first_comment ?? "",
      notes: p.notes ?? "",
      client_visible: p.client_visible ?? false,
      project_id: p.project_id,
      task_id: p.task_id,
      project_name: proj?.name ?? null,
      task_title: task?.title ?? null,
      created_by: p.created_by,
      creator_name: creator
        ? (creator.full_name ?? `@${creator.username}`)
        : null,
      created_at: p.created_at,
    };
  });

  const projects = (projectsRaw ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const tasks = (tasksRaw ?? []).map((tk) => ({
    id: tk.id,
    title: tk.title,
    project_id: tk.project_id,
  }));

  return (
    <SocialMediaView
      posts={posts}
      projects={projects}
      tasks={tasks}
      preselectedTaskId={preselectedTaskId}
    />
  );
}
