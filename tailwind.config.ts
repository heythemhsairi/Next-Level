import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cinematic Red — pure black canvas, one scarlet accent.
        // `brand` = primary red; `accent` reuses red as the single accent.
        brand: {
          DEFAULT: "#FF2A2A", // neon scarlet (primary accent)
          dark: "#B00C12", // gradient base / pressed
          light: "#FF4D4D", // lighter red (hover / gradient top)
          blood: "#7A0509", // deep shadow red
        },
        accent: {
          DEFAULT: "#FF4D4D",
          dark: "#FF2A2A",
          light: "#B00C12",
        },
        // Layered near-black surfaces.
        ink: {
          DEFAULT: "#050505", // page background (near-pure black)
          soft: "#0C0B0C", // raised section bg (--surface)
          2: "#141113", // card bg (--surface-2)
          3: "#1C1719", // input / hover bg (--surface-3)
        },
        // Text ramp.
        cream: {
          DEFAULT: "#FAFAFA", // primary text (--white)
          dark: "#ABA4A8", // secondary text (--dim)
          dim: "#837C81", // tertiary / placeholder (--dim-2)
        },
        whatsapp: "#25D366",
      },
      fontFamily: {
        // Display / headings — Sora, falling back through the body stack.
        display: [
          "var(--font-sora)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        // Body / UI default — Cairo first so Arabic stays consistent.
        sans: [
          "var(--font-cairo)",
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        // Latin body.
        body: [
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        // Arabic.
        ar: [
          "var(--font-cairo)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "14px",
        DEFAULT: "22px",
        lg: "30px",
      },
      boxShadow: {
        // Red drop-glow under solid buttons (rest → hover).
        "brand-glow": "0 12px 36px -12px rgba(255, 42, 42, 0.65)",
        "brand-glow-hover": "0 18px 50px -12px rgba(255, 42, 42, 0.85)",
        "accent-glow": "0 12px 36px -12px rgba(255, 42, 42, 0.65)",
        // Card hover red glow.
        "card-glow": "0 24px 50px -28px rgba(255, 42, 42, 0.7)",
      },
      backgroundImage: {
        // Solid red button / accent.
        "brand-gradient": "linear-gradient(135deg, #FF2A2A, #B00C12)",
        // Hero red text pop.
        "accent-gradient": "linear-gradient(135deg, #FF4D4D, #B00C12)",
        // Card fill.
        "card-gradient": "linear-gradient(180deg, #141113, #0C0B0C)",
        // Media stage fill.
        "media-gradient": "linear-gradient(135deg, #1c1416, #0d0a0c)",
        // Cinematic page glow.
        "hero-mesh":
          "radial-gradient(120% 80% at 50% -10%, rgba(255,42,42,0.10), transparent 55%), radial-gradient(100% 100% at 50% 100%, rgba(0,0,0,0.6), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
