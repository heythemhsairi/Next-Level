"use client";

import { useEffect, useState } from "react";

type Props = {
  to: number;
  /** Total animation duration in ms */
  duration?: number;
  /** Number of decimals to display */
  decimals?: number;
  /** Optional prefix (e.g. "$") */
  prefix?: string;
  /** Optional suffix (e.g. " DT") */
  suffix?: string;
  /** Locale for thousand separators. Defaults to fr-FR. */
  locale?: string;
  className?: string;
};

/**
 * Animated number that counts from 0 → `to` once on mount, using
 * requestAnimationFrame and an ease-out cubic curve. Falls back to the
 * final value gracefully on reduced-motion / SSR.
 */
export function CountUp({
  to,
  duration = 900,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = "fr-FR",
  className,
}: Props) {
  // The real value is present on first paint and in background tabs, where
  // requestAnimationFrame may be paused indefinitely.
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (document.visibilityState !== "visible" ||
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
    ) {
      setValue(to);
      return;
    }

    setValue(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  const formatted = value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
