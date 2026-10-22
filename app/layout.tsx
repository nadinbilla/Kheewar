import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@livekit/components-styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "KalamVerse — Speak Arabic together",
  description: "Dunia virtual untuk berlatih Maharah Kalam bersama pengguna lain.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
