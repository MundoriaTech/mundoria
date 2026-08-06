import type { Metadata } from "next";
import Script from "next/script";

import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "CleanScape",
    template: "%s | CleanScape",
  },
  description: "Book trusted local cleaning professionals.",
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { type: "image/x-icon", url: "/favicon.ico" },
      { type: "image/png", url: "/images/brand/favicon-32.png" },
      { type: "image/png", url: "/images/brand/cleanscape-mark.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              try {
                var saved = localStorage.getItem('cleanscape-theme');
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var shouldDark = saved === 'dark' || ((saved === 'system' || !saved) && prefersDark);
                document.documentElement.classList.toggle('dark', !!shouldDark);
              } catch (e) {}
            })();
          `,
        }}
      />
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
