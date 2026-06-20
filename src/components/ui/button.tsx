import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "accent" | "ink";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClass: Record<Variant, string> = {
  // Solid scarlet pill: red gradient, white text, red drop-glow, lifts on hover.
  primary:
    "bg-[linear-gradient(135deg,#FF2A2A,#B00C12)] text-white shadow-brand-glow hover:-translate-y-[3px] hover:shadow-brand-glow-hover active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-brand-glow",
  // Accent = same scarlet treatment (single accent system).
  accent:
    "bg-[linear-gradient(135deg,#FF4D4D,#B00C12)] text-white shadow-brand-glow hover:-translate-y-[3px] hover:shadow-brand-glow-hover active:translate-y-0 disabled:opacity-50",
  ink:
    "bg-[linear-gradient(180deg,#1C1719,#0C0B0C)] text-cream border border-white/10 hover:-translate-y-[3px] hover:border-white/15 active:translate-y-0 disabled:opacity-50",
  // Ghost / secondary: frosted, lights up red on hover.
  ghost:
    "bg-white/[0.04] text-cream/80 border border-white/[0.14] hover:bg-[rgba(255,42,42,0.08)] hover:border-brand hover:text-white hover:-translate-y-[3px] active:translate-y-0",
  outline:
    "border border-white/[0.14] bg-transparent text-cream hover:bg-[rgba(255,42,42,0.08)] hover:border-brand hover:-translate-y-[3px] active:translate-y-0",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-[26px] text-[15px]",
  lg: "h-[52px] px-[38px] text-base",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-display font-bold tracking-tight transition-all duration-[350ms] ease-[cubic-bezier(.22,1,.36,1)] disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    />
  );
});
