"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import {
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_TONE,
  type DeliverableStatus,
} from "../deliverable-status";
import { VideoEmbed } from "@/components/video-embed";
import {
  approveDeliverableAction,
  requestRevisionAction,
  addFeedbackAction,
} from "./actions";

export type FeedbackItem = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  is_mine: boolean;
};

export type VideoCardData = {
  id: string;
  title: string;
  status: DeliverableStatus;
  video_url: string | null;
  thumbnail_url: string | null;
  delivered_at: string | null;
  project_name: string | null;
  feedback: FeedbackItem[];
};

export function VideoCard({ video }: { video: VideoCardData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [revising, setRevising] = useState(false);
  const [pending, start] = useTransition();

  const isApproved = video.status === "approved";

  function run(action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData) {
    setError(null);
    start(async () => {
      const res = await action(fd);
      if (res.ok) {
        setRevising(false);
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function onApprove() {
    const fd = new FormData();
    fd.set("deliverable_id", video.id);
    run(approveDeliverableAction, fd);
  }

  function onRequestRevision(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("deliverable_id", video.id);
    run(requestRevisionAction, fd);
  }

  function onComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("deliverable_id", video.id);
    run(addFeedbackAction, fd);
    form.reset();
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative p-3 pb-0">
        <VideoEmbed url={video.video_url} />
        <span className="absolute right-5 top-5">
          <Badge tone={DELIVERABLE_STATUS_TONE[video.status]}>
            {DELIVERABLE_STATUS_LABEL[video.status]}
          </Badge>
        </span>
      </div>

      <CardContent className="space-y-3 p-4">
        <div>
          <p className="font-semibold text-ink/90">{video.title}</p>
          <p className="text-xs text-ink/45">
            {video.project_name ?? "—"}
            {video.delivered_at ? ` · Delivered ${formatDate(video.delivered_at)}` : ""}
          </p>
        </div>

        {/* Approve / request revision */}
        {isApproved ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            ✓ You approved this video
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button size="sm" onClick={onApprove} disabled={pending}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRevising((v) => !v)}
                disabled={pending}
              >
                Request changes
              </Button>
            </div>
            {revising && (
              <form onSubmit={onRequestRevision} className="space-y-2">
                <textarea
                  name="note"
                  required
                  rows={3}
                  placeholder="What would you like changed? (e.g. “At 0:14, use the new logo.”)"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink/90 placeholder:text-ink/35 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Sending…" : "Send revision request"}
                </Button>
              </form>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {/* Feedback thread */}
        <div className="border-t border-white/10 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink/45">
            Feedback
          </p>
          {video.feedback.length > 0 && (
            <ul className="mb-3 space-y-2">
              {video.feedback.map((f) => (
                <li key={f.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <p className="text-ink/85">{f.body}</p>
                  <p className="mt-0.5 text-[11px] text-ink/40">
                    {f.is_mine ? "You" : f.author_name} · {formatDate(f.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={onComment} className="flex gap-2">
            <input
              name="body"
              required
              placeholder="Add a comment…"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink/90 placeholder:text-ink/35 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <Button type="submit" size="sm" variant="ghost" disabled={pending}>
              Send
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
