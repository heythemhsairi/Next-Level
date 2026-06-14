import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import { ToastProvider } from "@/components/toast";

// Next Level type system: Inter for Latin/UI, Cairo for Arabic.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Next Level Studio",
  description: "Internal management workspace for Next Level.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Next Level is dark-mode only — the `dark` class is fixed on <html>.
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${cairo.variable}`}
    >
      <body>
        <I18nProvider>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
