import localFont from "next/font/local";

/**
 * Site typography (Sora). Self-hosted so `next build` does not depend on
 * Google Fonts — Google sometimes returns extensionless kit URLs that crash
 * next/font/google on Next 14 (TypeError … reading '1').
 */
export const sora = localFont({
  display: "swap",
  src: [
    {
      path: "../fonts/sora/sora-latin-300-normal.woff2",
      style: "normal",
      weight: "300",
    },
    {
      path: "../fonts/sora/sora-latin-400-normal.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "../fonts/sora/sora-latin-500-normal.woff2",
      style: "normal",
      weight: "500",
    },
    {
      path: "../fonts/sora/sora-latin-600-normal.woff2",
      style: "normal",
      weight: "600",
    },
    {
      path: "../fonts/sora/sora-latin-700-normal.woff2",
      style: "normal",
      weight: "700",
    },
    {
      path: "../fonts/sora/sora-latin-800-normal.woff2",
      style: "normal",
      weight: "800",
    },
  ],
  variable: "--font-sora",
});
