import type { Metadata } from "next";
import type { Viewport } from "next";

import { PwaRegister } from "../components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "COSMIQ",
  description:
    "Transparent astrology calculations with a secure backend-for-frontend architecture.",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#0B1829"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
