import type { Metadata } from "next";

import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CleanScape",
    template: "%s | CleanScape",
  },
  description: "Book trusted local cleaning professionals.",
  icons: {
    apple: "/images/brand/cleanscape-mark.png",
    icon: "/images/brand/cleanscape-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
