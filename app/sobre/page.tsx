import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre | Inglaterra Premium",
  description:
    "Conheça a Inglaterra Premium, unidade de imóveis de alto padrão do Grupo Inglaterra em Londrina.",
};

export default function SobrePage() {
  return (
    <main className="bg-offwhite text-navy">
      <section className="site-container py-[120px] md:py-[160px]">
        <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
          Inglaterra Premium
        </p>
        <h1 className="mb-6 max-w-[720px] text-[clamp(32px,6vw,58px)] font-light leading-[1.08] tracking-[0.01em]">
          Curadoria imobiliária de alto padrão em Londrina
        </h1>
        <p className="max-w-[620px] text-[15px] leading-[1.9] text-sand">
          Página institucional em preparação. Enquanto isso, a navegação pública
          permanece íntegra e sem rotas quebradas.
        </p>
      </section>
    </main>
  );
}
