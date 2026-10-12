import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Commodity Derivatives Intelligence | MCX Gold Surveillance",
  description: "Cross-contract relative-value and quantitative market intelligence for India MCX gold futures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col bg-ground text-ink antialiased font-sans">
        <main className="flex-1">{children}</main>

        <footer className="border-t border-line bg-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-3">
            <div className="flex items-center space-x-2 font-medium">
              <span className="font-semibold text-ink">Commodity Derivatives Intelligence</span>
              <span>&bull;</span>
              <span>MCX Gold Surveillance Engine</span>
            </div>

            <div className="text-center sm:text-right text-[11px] text-muted font-mono">
              <span>Decision-support analytics. Not investment advice.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
