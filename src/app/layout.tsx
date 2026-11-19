import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FatherShops | Good finds, better days",
  description:
    "Explore the FatherShops edit: thoughtful picks for your wardrobe, home, and everyday.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
