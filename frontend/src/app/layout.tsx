import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Commodity Derivatives Intelligence | MCX Gold Surveillance",
  description: "Cross-contract relative-value and quantitative market intelligence for India MCX gold futures. Team Holyknight (Hack in Hills '26).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 antialiased font-sans">
        <main className="flex-1">{children}</main>

        {/* Regulatory & Institutional Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#0B192C]">Commodity Derivatives Intelligence</span>
              <span>&bull;</span>
              <span>Hack in Hills '26 (Team Holyknight)</span>
            </div>

            <div className="text-center sm:text-right text-[11px] text-slate-400 font-mono">
              <span className="font-semibold text-slate-600 block sm:inline">
                Decision-support analytics. Not investment advice.
              </span>
              <span className="hidden sm:inline"> &bull; </span>
              <span>For institutional quantitative research &amp; surveillance demonstration.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
