import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader, Manrope } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "遇亭 — 我们的旅行地图",
  description: "记录我们的每一次相聚",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "遇亭",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#d6bba1" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* SVG filters for texture overlays — must be in body, not head */}
        <svg className="hidden" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <filter id="wood-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.04 0.4" numOctaves="6" seed="2" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <filter id="fine-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="15" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
