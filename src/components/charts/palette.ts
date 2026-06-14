// Plain server-friendly module (no "use client") so server components can
// import the brand palette without crossing a client boundary.

export const DONUT_PALETTE = [
  "#E11D2A", // brand
  "#FF4D5E", // accent
  "#1E1E24", // ink
  "#FF4D5E", // brand light
  "#FCA5A5", // accent light
  "#5A5A66", // ink soft
  "#7F1018", // brand dark
  "#B0151F", // accent dark
];

export function getDonutPalette(): string[] {
  return [...DONUT_PALETTE];
}
