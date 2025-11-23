<<<<<<< HEAD
﻿import type { Metadata } from "next";
=======
import type { Metadata } from "next";
>>>>>>> origin/main
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloudflare Pages Test",
  description: "Test deployment for Cloudflare Pages with GitHub Actions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
