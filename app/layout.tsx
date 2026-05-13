import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mother's Day 2026 DP Maker",
  description: "Create Mother's Day display pictures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
