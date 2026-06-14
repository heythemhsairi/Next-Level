// Plain server-friendly module (no "use client") so server components can
// import the brand palette without crossing a client boundary.

export const DONUT_PALETTE = [
  "#7C3AED", // brand
  "#9B5DFF", // accent
  "#1E1E24", // ink
  "#9B5DFF", // brand light
  "#C4B5FD", // accent light
  "#5A5A66", // ink soft
  "#4C1D95", // brand dark
  "#6D28D9", // accent dark
];

export function getDonutPalette(): string[] {
  return [...DONUT_PALETTE];
}
