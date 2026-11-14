import type { Metadata } from "next";
import Link from "next/link";
import { organization } from "@/lib/site";
import { contactSettings } from "@/lib/contact-settings";

export const metadata: Metadata = {
  alternates: { canonical: "/contato" },
  title: "Contato | Inglaterra Premium",
  description:
    "Fale com a Inglaterra Premium para atendimento sobre imóveis de alto padrão em Londrina.",
};

export default function ContatoPage() {
  return (
    <main className="bg-offwhite text-navy">
      <section className="site-container py-[120px] md:py-[160px]">
        <p className="mb-3 text-caption font-semibold uppercase tracking-[0.25em] text-terra">
          Contato
        </p>
        <h1 className="mb-6 max-w-[640px] text-[clamp(32px,6vw,58px)] font-light leading-[1.08] tracking-[0.01em]">
          Fale com a Inglaterra Premium
        </h1>
        <div className="grid max-w-[760px] grid-cols-1 gap-5 text-[14px] leading-[1.8] text-navy md:grid-cols-2">
          <div>
            <p className="text-navy"><a href={contactSettings.phoneHref}>{contactSettings.phone}</a></p>
            <p>{organization.email}</p>
          </div>
          <div>
            <p>{organization.address.streetAddress}</p>
            <p>Londrina, PR</p>
          </div>
        </div>
        <a
          className="mt-6 inline-flex min-h-11 items-center bg-terra px-6 py-3.5 text-caption uppercase tracking-[0.2em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terra"
          href={contactSettings.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
        <p className="mt-8 max-w-[520px] text-copy leading-relaxed text-navy">
          Para atendimento específico sobre Inglaterra BTS, acesse o canal do
          serviço.
        </p>
        <Link
          className="mt-4 inline-flex bg-terra px-6 py-3.5 text-caption uppercase tracking-[0.2em] text-white"
          href="/bts#formulario-bts"
        >
          Contato BTS
        </Link>
      </section>
    </main>
  );
}
