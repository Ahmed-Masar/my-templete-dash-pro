import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
