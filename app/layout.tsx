import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | PolitiKurs',
    default: 'PolitiKurs - Politik, aber verständlich',
  },
  description: "Wie hättest du im Bundestag entschieden? Vergleiche deine Meinung mit den Abstimmungen der Parteien. Einfach, neutral und transparent.",
  keywords: ["Bundestag", "Abstimmungen", "Politik", "Wahlomat", "Demokratie", "Transparenz", "PolitiKurs"],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://politikurs.de', // Placeholder, using generic if unknown
    title: 'PolitiKurs - Politik, aber verständlich',
    description: "Wie hättest du im Bundestag entschieden? Vergleiche deine Meinung mit den Abstimmungen der Parteien.",
    siteName: 'PolitiKurs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PolitiKurs - Politik, aber verständlich',
    description: "Wie hättest du im Bundestag entschieden? Vergleiche deine Meinung mit den Abstimmungen der Parteien.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-24`}
      >
        {children}
        <Navbar />
        <Analytics />
      </body>
    </html>
  );
}
