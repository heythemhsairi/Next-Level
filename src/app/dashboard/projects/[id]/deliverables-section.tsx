"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  createDeliverableAction,
  deleteDeliverableAction,
  setDeliverableStatusAction,
  toggleDeliverableVisibilityAction,
  type DeliverableStatus,
} from "../../deliverables/actions";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_TONE,
} from "../../deliverables/status";

export type ProjectDeliverable = {
  id: string;
  project_id: string;
  title: string;
  video_url: string | null;
  status: DeliverableStatus;
  client_visible: boolean;
};

export function DeliverablesSection({
  projectId,
  deliverables,
}: {
  projectId: string;
  deliverables: ProjectDeliverable[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("title", title.trim());
    fd.set("video_url", videoUrl.trim());
    fd.set("status", "draft");
    if (visible) fd.set("client_visible", "on");
    fd.set("stay", "1");
    startTransition(async () => {
      const res = await createDeliverableAction(fd);
      if (res && !res.ok) {
        setError(res.error);
        return;
      }
      setTitle("");
      setVideoUrl("");
      setVisible(false);
      router.refresh();
    });
  }

  function onStatusChange(d: ProjectDeliverable, status: DeliverableStatus) {
    const fd = new FormData();
    fd.set("id", d.id);
    fd.set("project_id", projectId);
    fd.set("status", status);
    startTransition(async () => {
      await setDeliverableStatusAction(fd);
      router.refresh();
    });
  }

  function onToggleVisible(d: ProjectDeliverable) {
    const fd = new FormData();
    fd.set("id", d.id);
    fd.set("project_id", projectId);
    fd.set("client_visible", String(!d.client_visible));
    startTransition(async () => {
      await toggleDeliverableVisibilityAction(fd);
      router.refresh();
    });
  }

  function onDelete(d: ProjectDeliverable) {
    if (!confirm(`Delete deliverable "${d.title}"?`)) return;
    const fd = new FormData();
    fd.set("id", d.id);
    fd.set("project_id", projectId);
    fd.set("stay", "1");
    startTransition(async () => {
      await deleteDeliverableAction(fd);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 lg:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Deliverables</h2>
        <Link href={`/dashboard/deliverables/new?projectId=${projectId}`}>
          <Button size="sm" variant="outline">
            Full editor
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5 md:pt-6">
          <form
            onSubmit={onAdd}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Deliverable title"
              className="sm:flex-1"
            />
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              type="url"
              placeholder="Video URL (optional)"
              className="sm:flex-1"
            />
            <label className="flex items-center gap-2 whitespace-nowrap text-sm text-ink/80">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                className="h-4 w-4 rounded border-ink/20 text-brand focus:ring-brand/30"
              />
              Visible
            </label>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Adding…" : "Add"}
            </Button>
          </form>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {deliverables.length === 0 ? (
            <p className="text-sm text-ink/55">
              No deliverables for this project yet.
            </p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {deliverables.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/deliverables/${d.id}`}
                      className="font-medium text-ink hover:text-brand"
                    >
                      {d.title}
                    </Link>
                    {d.video_url && (
                      <a
                        href={d.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-brand hover:underline"
                      >
                        Open video
                      </a>
                    )}
                  </div>

                  <Badge tone={STATUS_TONE[d.status]} dot>
                    {STATUS_LABEL[d.status]}
                  </Badge>

                  <Select
                    value={d.status}
                    onChange={(e) =>
                      onStatusChange(
                        d,
                        e.target.value as DeliverableStatus,
                      )
                    }
                    disabled={pending}
                    className="h-8 w-auto py-0 text-xs"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>

                  <Button
                    type="button"
                    size="sm"
                    variant={d.client_visible ? "accent" : "outline"}
                    onClick={() => onToggleVisible(d)}
                    disabled={pending}
                  >
                    {d.client_visible ? "Visible" : "Hidden"}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(d)}
                    disabled={pending}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
