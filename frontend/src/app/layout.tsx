import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "News Website Aggregation Platform",
  description: "A clean, intuitive news aggregation platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased text-foreground bg-background min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto max-w-content flex">
          <Sidebar className="hidden md:flex border-r" />
          <main className="flex-1 w-full overflow-hidden">
            {children}
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
