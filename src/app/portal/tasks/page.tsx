import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  deadline: string | null;
  projects: { name: string } | { name: string }[] | null;
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "In review",
  done: "Done",
  cancelled: "Cancelled",
};
const STATUS_TONE: Record<
  TaskStatus,
  "neutral" | "amber" | "violet" | "green" | "red"
> = {
  todo: "neutral",
  in_progress: "amber",
  review: "violet",
  done: "green",
  cancelled: "red",
};

function projectName(p: Task["projects"]): string | null {
  const row = Array.isArray(p) ? p[0] : p;
  return row?.name ?? null;
}

export default async function PortalTasks() {
  await requireClient();
  const supabase = await createClient();

  // RLS returns only tasks on this client's projects.
  const { data } = await supabase
    .from("tasks")
    .select("id, title, status, deadline, projects(name)")
    .order("deadline", { ascending: true });

  const tasks = (data ?? []) as Task[];
  const active = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  );
  const finished = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Tasks</h1>
        <p className="mt-1 text-sm text-ink/55">
          What your team is working on for you.
        </p>
      </div>

      <TaskGroup title="In progress" tasks={active} empty="Nothing in progress right now." />
      <TaskGroup title="Completed" tasks={finished} empty="No completed tasks yet." />
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  empty,
}: {
  title: string;
  tasks: Task[];
  empty: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/55">
          {title}
        </h2>
        {tasks.length === 0 ? (
          <p className="py-4 text-sm text-ink/45">{empty}</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink/90">{t.title}</p>
                  <p className="text-xs text-ink/45">
                    {projectName(t.projects) ?? "—"}
                    {t.deadline ? ` · Due ${formatDate(t.deadline)}` : ""}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[t.status]}>
                  {STATUS_LABEL[t.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
