import type { Metadata } from "next";

import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

import { FeedbackProvider } from "@/components/shared/feedback-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cleanscape-theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <FeedbackProvider>
            <AuthHashHandler />
            {children}
          </FeedbackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
