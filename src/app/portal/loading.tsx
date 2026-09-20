import { Skeleton } from "@/components/ui/skeleton";

export default function PortalLoading() {
  return (
    <div className="space-y-5" aria-label="Loading your portal">
      <div className="rounded-2xl border border-white/10 bg-ink-2 p-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-8 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    </div>
  );
}
