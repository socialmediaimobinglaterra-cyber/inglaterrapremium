import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inglaterra Premium",
  description: "Imóveis de alto padrão em Londrina.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const isAdmin = requestHeaders.get("x-inglaterra-admin-path") === "1";

  return (
    <html lang="pt-BR" className={dmSans.variable}>
      <body className="bg-offwhite font-sans text-navy antialiased">
        {isAdmin ? null : <Header />}
        {children}
        {isAdmin ? null : <Footer />}
      </body>
    </html>
  );
}
