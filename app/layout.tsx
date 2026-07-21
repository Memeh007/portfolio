import type { Metadata, Viewport } from "next";
import { Inter, Press_Start_2P, Space_Grotesk } from "next/font/google";
import { site } from "@/lib/data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafafa",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Alexander Cecena",
    template: "%s · Alexander Cecena",
  },
  description: site.description,
  keywords: [
    "bioengineering",
    "computational biochemistry",
    "laboratory information management",
    "Three.js",
    "embedded systems",
    "Python",
    "Alexander Cecena",
  ],
  authors: [{ name: "Alexander Cecena" }],
  creator: "Alexander Cecena",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: "Alexander Cecena",
    title: "Alexander Cecena",
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexander Cecena",
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${pressStart.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
