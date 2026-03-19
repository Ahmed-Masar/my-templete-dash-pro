import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const sfPro = localFont({
  src: [
    { path: "../../public/fonts/SF-Pro.ttf", style: "normal" },
    { path: "../../public/fonts/SF-Pro-Italic.ttf", style: "italic" },
  ],
  variable: "--font-sf-pro",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sahel Jeddah",
  description: "Vodex Management",
  authors: [{ name: "Vodex" }],
  openGraph: { title: "Sahel Jeddah", description: "Vodex", type: "website" },
  twitter: { card: "summary_large_image", site: "@vodex" },
  icons: {
    icon: "/sahel-logo.png",
    shortcut: "/sahel-logo.png",
    apple: "/sahel-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={sfPro.variable}>
      <body className="font-sf-pro">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
