import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ProjectProgress = {
  id: string;
  name: string;
  delivered: number;
  total: number;
};

/**
 * Per-project delivery progress — how many videos are delivered vs the total
 * shared on that project. Gives the client a sense of momentum on their work.
 * Warm placeholder when there are no active projects yet.
 */
export function ProjectProgressCard({ projects }: { projects: ProjectProgress[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your projects</CardTitle>
          <Link
            href="/portal/videos"
            className="text-xs font-semibold text-brand hover:text-brand-light"
          >
            View videos
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/12 text-xl">
              🎬
            </span>
            <p className="text-sm font-medium text-ink/80">
              Your projects will appear here
            </p>
            <p className="max-w-xs text-xs text-ink/45">
              Once your team kicks off a project, you'll see its progress and
              every video as it's delivered.
            </p>
          </div>
        ) : (
          <ul className="space-y-5">
            {projects.map((p) => {
              const pct =
                p.total > 0 ? Math.round((p.delivered / p.total) * 100) : 0;
              return (
                <li key={p.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink">
                      {p.name}
                    </p>
                    <p className="shrink-0 text-xs font-semibold text-ink/55 tabular-nums">
                      {p.delivered}/{p.total} delivered
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
