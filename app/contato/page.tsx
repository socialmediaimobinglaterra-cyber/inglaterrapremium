import type { Metadata } from "next";
import Link from "next/link";
import { organization } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato | Inglaterra Premium",
  description:
    "Fale com a Inglaterra Premium para atendimento sobre imóveis de alto padrão em Londrina.",
};

export default function ContatoPage() {
  return (
    <main className="bg-offwhite text-navy">
      <section className="site-container py-[120px] md:py-[160px]">
        <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
          Contato
        </p>
        <h1 className="mb-6 max-w-[640px] text-[clamp(32px,6vw,58px)] font-light leading-[1.08] tracking-[0.01em]">
          Fale com a Inglaterra Premium
        </h1>
        <div className="grid max-w-[760px] grid-cols-1 gap-5 text-[14px] leading-[1.8] text-sand md:grid-cols-2">
          <div>
            <p className="text-navy">{organization.telephone}</p>
            <p>{organization.email}</p>
          </div>
          <div>
            <p>{organization.address.streetAddress}</p>
            <p>Londrina, PR</p>
          </div>
        </div>
        <Link
          className="mt-8 inline-flex bg-terra px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white"
          href="/bts#formulario-bts"
        >
          Contato BTS
        </Link>
      </section>
    </main>
  );
}
