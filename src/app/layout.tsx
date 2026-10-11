import type { Metadata } from "next";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Setu, the bridge not the detour",
    template: "%s | Setu",
  },
  description:
    "Setu turns a QR scan into a straight line: instant redirect, private analytics, zero ads.",
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
