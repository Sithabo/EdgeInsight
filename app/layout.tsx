import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"; // Added Space_Grotesk
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EdgeInsight - AI Code Audit",
  description:
    "Analyze GitHub repositories instantly with Cloudflare Workers AI.",
  openGraph: {
    title: "EdgeInsight - AI Code Audit",
    description: "Instant architectural analysis for engineering teams.",
    url: "https://edge-insight.pages.dev",
    siteName: "EdgeInsight",
    images: [
      {
        url: "https://placehold.co/1200x630/1a1a1a/f37f20/png?text=EdgeInsight+AI",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col selection:bg-primary/30 font-sans`} // Added classes from mockup body
      >
        {children}
      </body>
    </html>
  );
}
