import { cn } from "@/lib/utils";

/**
 * A small streak pill. Shows the 🔥 only when the streak is meaningful (≥2)
 * so a single event doesn't look like a "streak". Renders nothing at 0.
 */
export function StreakChip({
  count,
  label,
  className,
}: {
  count: number;
  label: string;
  className?: string;
}) {
  if (count <= 0) return null;
  const hot = count >= 2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ring-1",
        hot
          ? "bg-brand/15 text-brand-light ring-brand/30"
          : "bg-white/[0.06] text-ink/70 ring-white/10",
        className,
      )}
    >
      {hot && <span aria-hidden>🔥</span>}
      <span className="tabular-nums">{count}</span>
      <span className="font-semibold opacity-80">{label}</span>
    </span>
  );
}
