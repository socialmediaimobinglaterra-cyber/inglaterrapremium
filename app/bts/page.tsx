import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BtsContactForm } from "@/components/bts/BtsContactForm";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Inglaterra BTS | Built to Suit Corporativo em Londrina",
  description:
    "Inglaterra BTS: imóveis corporativos sob medida em Londrina, do terreno ao contrato de locação de longo prazo.",
  openGraph: {
    title: "Inglaterra BTS | Built to Suit Corporativo em Londrina",
    description:
      "Imóveis corporativos projetados e construídos sob medida para empresas em Londrina.",
    type: "website",
    url: absoluteUrl("/bts"),
    images: [{ url: absoluteUrl("/images/capa-hero.jpg"), alt: "Inglaterra BTS em Londrina" }],
  },
};

const etapas = [
  {
    num: "01",
    titulo: "Diagnóstico",
    texto:
      "Entendemos a necessidade da empresa — ou o potencial do terreno — para desenhar o projeto certo.",
  },
  {
    num: "02",
    titulo: "Projeto sob medida",
    texto:
      "Desenvolvemos o imóvel especificamente para a operação da empresa contratante, sem plantas padronizadas.",
  },
  {
    num: "03",
    titulo: "Construção acompanhada",
    texto:
      "A obra é acompanhada pela Inglaterra Premium do início ao fim, com relatórios periódicos ao proprietário do terreno.",
  },
  {
    num: "04",
    titulo: "Contrato de locação",
    texto:
      "Assinatura de contrato de locação de longo prazo, com segurança jurídica para o proprietário e para a empresa locatária.",
  },
];

const paraProprietarios = [
  "Renda garantida por contrato de locação de longo prazo",
  "Zero risco e zero custo de construção para você",
  "Empresa locatária qualificada previamente pela Inglaterra",
  "Valorização do terreno sem precisar desenvolvê-lo",
  "Assessoria jurídica e contratual completa",
];

const paraEmpresas = [
  "Imóvel projetado conforme a operação da sua empresa",
  "Sem necessidade de capital próprio em construção",
  "Localização estratégica em Londrina, à sua escolha",
  "Segurança jurídica em contrato de locação de longo prazo",
  "Acompanhamento da obra até a entrega das chaves",
];

const numeros = [
  { v: "R$ 45 mi", l: "Em contratos ativos" },
  { v: "12 mil m²", l: "Área construída" },
  { v: "10 anos", l: "Contrato médio" },
];

const cases = [
  {
    nome: "Centro de Distribuição Zona Sul",
    desc:
      "Galpão logístico de 4.200 m² desenvolvido sob medida para operação de e-commerce, com contrato de locação de 15 anos.",
    stat1: { v: "4.200 m²", l: "Área construída" },
    stat2: { v: "15 anos", l: "Contrato" },
    image: "https://picsum.photos/seed/casebts1/900/700",
  },
  {
    nome: "Sede Administrativa Gleba Palhano",
    desc:
      "Edifício corporativo de 3 pavimentos projetado para a sede regional de uma empresa de tecnologia, com contrato de locação de 10 anos.",
    stat1: { v: "1.800 m²", l: "Área construída" },
    stat2: { v: "10 anos", l: "Contrato" },
    image: "https://picsum.photos/seed/casebts2/900/700",
  },
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div
          className="flex items-center gap-2.5 border-b border-navy/10 pb-2.5 text-[13px] text-navy"
          key={item}
        >
          <div className="h-1 w-1 shrink-0 bg-terra" />
          {item}
        </div>
      ))}
    </div>
  );
}

function CaseCard({ item }: { item: (typeof cases)[number] }) {
  return (
    <div className="bg-white">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          alt={`Case Inglaterra BTS — ${item.nome}, Londrina`}
          className="h-full w-full object-cover"
          src={item.image}
        />
      </div>
      <div className="px-1 py-5 md:pb-0 md:pt-6">
        <h3 className="mb-2.5 text-[18px] font-normal text-navy">{item.nome}</h3>
        <p className="mb-4 text-[13px] leading-[1.75] text-[#4a4a48]">{item.desc}</p>
        <div className="flex gap-7">
          {[item.stat1, item.stat2].map((stat) => (
            <div key={stat.l}>
              <p className="text-[20px] font-medium text-terra">{stat.v}</p>
              <p className="text-[9.5px] uppercase tracking-[0.05em] text-navy">
                {stat.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BreadcrumbJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Inglaterra BTS",
        item: absoluteUrl("/bts"),
      },
    ],
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      type="application/ld+json"
    />
  );
}

export default function BtsPage() {
  return (
    <main className="bg-offwhite text-navy">
      <BreadcrumbJsonLd />

      <section className="site-container pt-[88px] md:pt-[108px]">
        <p className="mb-4 text-[11px] text-navy">Início / Inglaterra BTS</p>
        <span className="mb-4 inline-block bg-terra px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white">
          Built to Suit Corporativo
        </span>
        <h1 className="mb-3.5 max-w-[720px] text-[clamp(26px,8vw,34px)] font-light leading-[1.15] tracking-[0.01em] md:text-[clamp(32px,3.6vw,50px)]">
          Inglaterra BTS — Imóveis Corporativos Sob Medida em Londrina
        </h1>
        <p className="mb-7 max-w-[580px] text-sm leading-[1.7] text-navy">
          Desenvolvemos e locamos imóveis projetados especificamente para a
          operação da sua empresa — do terreno ao contrato de locação de longo prazo.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="bg-terra px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white"
            href="#contato-bts"
          >
            Tenho um terreno
          </Link>
          <Link
            className="border border-navy px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-navy"
            href="#contato-bts"
          >
            Preciso de um espaço sob medida
          </Link>
        </div>
      </section>

      <div className="site-container pt-6 md:pt-8">
        <div className="aspect-[4/3] overflow-hidden md:aspect-[21/9]">
          <img
            alt="Imóvel corporativo sob medida — Inglaterra BTS, Londrina"
            className="h-full w-full object-cover"
            src="https://picsum.photos/seed/btsmain/1400/900"
          />
        </div>
      </div>

      <section className="site-container py-8 md:py-12">
        <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
          Inglaterra BTS em números
        </p>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {numeros.map((numero) => (
            <div className="bg-white px-2 py-4 text-center md:px-4 md:py-6" key={numero.l}>
              <p className="mb-1 text-[15px] font-medium text-navy md:text-2xl">
                {numero.v}
              </p>
              <p className="text-[8.5px] uppercase tracking-[0.04em] text-navy md:text-[10.5px]">
                {numero.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-container grid grid-cols-1 gap-8 bg-white py-10 md:grid-cols-2 md:gap-14 md:py-16">
        <div>
          <h2 className="mb-2 text-[19px] font-normal text-navy md:text-[22px]">
            Você tem um terreno?
          </h2>
          <p className="mb-5 text-[13px] text-navy">
            Transforme seu terreno em renda garantida, sem construir nada
          </p>
          <FeatureList items={paraProprietarios} />
        </div>
        <div>
          <h2 className="mb-2 text-[19px] font-normal text-navy md:text-[22px]">
            Sua empresa precisa de um espaço sob medida?
          </h2>
          <p className="mb-5 text-[13px] text-navy">
            Um imóvel projetado para a sua operação, sem investir em construção
          </p>
          <FeatureList items={paraEmpresas} />
        </div>
      </section>

      <section className="site-container py-12 md:py-[72px]">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
          O processo
        </p>
        <h2 className="mb-7 max-w-[500px] text-[22px] font-light tracking-[0.01em] text-navy md:mb-10 md:text-[30px]">
          Como funciona
        </h2>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-4 md:gap-1">
          {etapas.map((etapa, index) => (
            <div
              className={`md:pr-6 ${
                index > 0 ? "md:border-l md:border-navy/10 md:pl-6" : ""
              }`}
              key={etapa.num}
            >
              <p className="mb-2.5 text-[26px] font-light text-terra">{etapa.num}</p>
              <h3 className="mb-2.5 text-[15px] font-semibold text-navy">
                {etapa.titulo}
              </h3>
              <p className="text-[13px] leading-[1.75] text-[#4a4a48]">
                {etapa.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-container bg-white py-12 md:py-[72px]">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
          Cases de sucesso
        </p>
        <h2 className="mb-6 text-[22px] font-light tracking-[0.01em] text-navy md:mb-8 md:text-[30px]">
          Imóveis corporativos entregues pela Inglaterra BTS
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          {cases.map((item) => (
            <CaseCard item={item} key={item.nome} />
          ))}
        </div>
      </section>

      <section className="site-container grid grid-cols-1 gap-8 py-12 md:grid-cols-[1fr_420px] md:gap-16 md:py-[72px]" id="contato-bts">
        <div>
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
            Fale com nosso especialista
          </p>
          <h2 className="mb-7 max-w-[480px] text-[22px] font-light tracking-[0.01em] text-navy md:mb-10 md:text-[30px]">
            Nossa equipe está pronta para estruturar o contrato certo para você
          </h2>
          <div className="flex max-w-[380px] items-center gap-5">
            <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-full">
              <Image
                alt="Wagner Lopes Redon, Diretor de Locação da Inglaterra Premium"
                className="object-cover object-top"
                fill
                sizes="76px"
                src="/images/diretor-wagner.jpg"
              />
            </div>
            <div>
              <p className="mb-0.5 text-[17px] font-medium text-navy">
                Wagner Lopes Redon
              </p>
              <p className="mb-2 text-xs text-navy">
                Diretor de Locação · Inglaterra BTS
              </p>
              <a
                className="inline-block border-b border-terra pb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-terra"
                href="#formulario-bts"
              >
                Entrar em contato
              </a>
            </div>
          </div>
        </div>

        <div className="bg-navy p-6 md:p-8" id="formulario-bts">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-terra-light">
            Quero falar sobre BTS
          </p>
          <BtsContactForm />
        </div>
      </section>
    </main>
  );
}
