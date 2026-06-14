import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Visual width target in pixels (drives the font size). */
  width?: number;
  /**
   * When true, the whole wordmark renders in a single `currentColor`
   * (no purple accent, no glow) — used on the printed devis/facture where
   * the document is monochrome. Defaults to the brand lockup.
   */
  mono?: boolean;
};

/**
 * Next Level wordmark — "Next" + purple "Level" + a glowing purple dot.
 * Text-based (not an SVG path) so it stays razor-sharp at any size and
 * matches the brand kit exactly. Scales with the `width` prop, which maps
 * to a font size (the lockup is ~5.4× wider than its cap-height).
 */
export function BrandLogo({ className, width = 140, mono = false }: Props) {
  // Wordmark is roughly 5.4 units wide per 1 unit of font-size.
  const fontSize = Math.round((width / 5.4) * 10) / 10;

  return (
    <span
      className={cn(
        "inline-flex items-center font-black leading-none tracking-tight",
        mono ? "text-current" : "text-cream",
        className,
      )}
      style={{ fontSize }}
      aria-label="Next Level"
      role="img"
    >
      <span>Next</span>
      <span className={mono ? undefined : "text-brand"}>Level</span>
      {!mono && (
        <span
          aria-hidden
          className="ml-[0.12em] inline-block rounded-full bg-brand"
          style={{
            width: "0.16em",
            height: "0.16em",
            boxShadow: "0 0 0.5em rgba(225, 29, 42, 0.9)",
          }}
        />
      )}
    </span>
  );
}
