import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Next Level brand palette — royal purple on near-black.
        // `brand` = primary purple; `accent` reuses purple (purple is the
        // ONLY accent in this brand). Semantic green/red stay separate.
        brand: {
          DEFAULT: "#7C3AED", // royal purple (--nl-primary)
          dark: "#4C1D95", // deep purple (gradients / pressed)
          light: "#9B5DFF", // soft purple (hover / accent text)
        },
        accent: {
          DEFAULT: "#9B5DFF", // primary-soft purple
          dark: "#7C3AED",
          light: "#4C1D95",
        },
        ink: {
          DEFAULT: "#0A0A0B", // app background (--nl-bg-0)
          soft: "#121214", // surface / panel (--nl-bg-1)
        },
        cream: {
          DEFAULT: "#F5F5F7", // high-contrast text (--nl-text-hi)
          dark: "#A1A1A8", // secondary text (--nl-text-lo)
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "var(--font-cairo)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        "brand-glow":
          "0 8px 30px rgba(124, 58, 237, 0.35), 0 4px 12px -4px rgba(124, 58, 237, 0.25)",
        "accent-glow":
          "0 8px 30px rgba(124, 58, 237, 0.35), 0 4px 12px -4px rgba(124, 58, 237, 0.25)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)",
        "accent-gradient":
          "linear-gradient(135deg, #9B5DFF 0%, #7C3AED 100%)",
        "hero-mesh":
          "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(ellipse 70% 60% at 100% 0%, rgba(124,58,237,0.12), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
