import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-ink/8 bg-white shadow-soft">
      <table className={cn("w-full text-sm", className)} {...rest} />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className="border-b border-ink/8 bg-cream-dark/50 text-ink/55"
      {...props}
    />
  );
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-ink/5" {...props} />;
}

export function TR(props: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className="transition-colors duration-150 hover:bg-cream/70"
      {...props}
    />
  );
}

export function TH({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] first:pl-4 last:pr-4",
        className,
      )}
      {...rest}
    />
  );
}

export function TD({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-3 py-3.5 text-ink first:pl-4 last:pr-4",
        className,
      )}
      {...rest}
    />
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-2 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-ink/55">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 5h16v14H4z M8 9h8 M8 13h5" />
        </svg>
      </div>
      <p className="text-sm leading-relaxed text-ink/65">{children}</p>
    </div>
  );
}
