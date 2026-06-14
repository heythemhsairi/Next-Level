import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Next Level brand palette — crimson red on black.
        // `brand` = primary red; `accent` reuses red as the single accent.
        brand: {
          DEFAULT: "#E11D2A", // crimson red (primary)
          dark: "#7F1018", // deep blood red (gradients / pressed)
          light: "#FF4D5E", // bright red (hover / accent text)
        },
        accent: {
          DEFAULT: "#FF4D5E",
          dark: "#E11D2A",
          light: "#7F1018",
        },
        ink: {
          DEFAULT: "#0B0B0C", // app background (true near-black)
          soft: "#141416", // surface / panel
        },
        cream: {
          DEFAULT: "#F7F7F8", // high-contrast text
          dark: "#A0A0A6", // secondary text
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
          "0 8px 30px rgba(225, 29, 42, 0.35), 0 4px 12px -4px rgba(225, 29, 42, 0.25)",
        "accent-glow":
          "0 8px 30px rgba(225, 29, 42, 0.35), 0 4px 12px -4px rgba(225, 29, 42, 0.25)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #E11D2A 0%, #7F1018 100%)",
        "accent-gradient":
          "linear-gradient(135deg, #FF4D5E 0%, #E11D2A 100%)",
        "hero-mesh":
          "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(225,29,42,0.18), transparent 60%), radial-gradient(ellipse 70% 60% at 100% 0%, rgba(225,29,42,0.12), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
