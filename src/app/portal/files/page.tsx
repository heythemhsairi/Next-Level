import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

type AssetRow = {
  id: string;
  name: string;
  url: string;
  kind: string | null;
  created_at: string;
  projects: { name: string } | { name: string }[] | null;
};

function projectName(p: AssetRow["projects"]): string | null {
  const row = Array.isArray(p) ? p[0] : p;
  return row?.name ?? null;
}

export default async function PortalFiles() {
  await requireClient();
  const supabase = await createClient();

  // RLS returns only client_visible assets on this client.
  const { data } = await supabase
    .from("assets")
    .select("id, name, url, kind, created_at, projects(name)")
    .order("created_at", { ascending: false });

  const files = (data ?? []) as AssetRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Files</h1>
        <p className="mt-1 text-sm text-ink/55">
          Files and assets your team has shared with you.
        </p>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-ink/50">
            No files shared with you yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => {
            const project = projectName(f.projects);
            return (
              <Card key={f.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-medium text-ink/90">
                      {f.name}
                    </p>
                    {f.kind ? <Badge tone="neutral">{f.kind}</Badge> : null}
                  </div>
                  <div className="text-xs text-ink/45">
                    {project ? <p className="truncate">{project}</p> : null}
                    <p>{formatDate(f.created_at)}</p>
                  </div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-ink/85 transition-colors hover:bg-white/10"
                  >
                    Open
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
