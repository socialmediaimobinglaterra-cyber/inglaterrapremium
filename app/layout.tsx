import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { absoluteUrl, organization } from "@/lib/site";
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

function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent"],
    name: organization.name,
    legalName: organization.legalName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/logo-navy.png"),
    email: organization.email,
    telephone: organization.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: organization.address.streetAddress,
      addressLocality: organization.address.addressLocality,
      addressRegion: organization.address.addressRegion,
      postalCode: organization.address.postalCode || undefined,
      addressCountry: organization.address.addressCountry,
    },
    areaServed: {
      "@type": "City",
      name: "Londrina",
      addressRegion: "PR",
      addressCountry: "BR",
    },
  };
}

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
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
          type="application/ld+json"
        />
        {isAdmin ? null : <Header />}
        {children}
        {isAdmin ? null : <Footer />}
        <Analytics />
      </body>
    </html>
  );
}
