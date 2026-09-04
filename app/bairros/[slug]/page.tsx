import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { imageUrlOrFallback } from "@/lib/images";
import { getBairroPageData, type BairroDetail } from "@/lib/queries/bairros";
import type { ImovelSearchResult } from "@/lib/queries/imoveis";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function currency(value: number | null) {
  if (value === null) return "Sob consulta";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function area(value: number | null) {
  if (value === null) return "Área sob consulta";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;
}

function faqJsonLd(bairro: BairroDetail) {
  if (bairro.faq.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: bairro.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function breadcrumbJsonLd(bairro: BairroDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Bairros",
        item: absoluteUrl("/bairros"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: bairro.nome,
        item: absoluteUrl(`/bairros/${bairro.slug}`),
      },
    ],
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBairroPageData(slug);

  if (!data) return { title: "Bairro não encontrado | Inglaterra Premium" };

  const title = `Imóveis de alto padrão em ${data.bairro.nome}, Londrina | Inglaterra Premium`;
  const description = `${data.bairro.imoveisDisponiveis} imóveis premium disponíveis em ${data.bairro.nome}, Londrina, com valor médio de venda de ${currency(data.bairro.valorMedioVenda)}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: data.bairro.heroImage
        ? [{ url: data.bairro.heroImage, alt: `Bairro ${data.bairro.nome}, Londrina` }]
        : undefined,
    },
  };
}

function ImovelCard({ imovel }: { imovel: ImovelSearchResult }) {
  const price = imovel.precoVenda ?? imovel.precoLocacao;
  const image = imageUrlOrFallback(imovel.image);

  return (
    <Link className="group block text-inherit no-underline" href={`/imoveis/${imovel.slug}`}>
      <div className="relative aspect-[5/4] overflow-hidden bg-[#1e1e1e]">
        <Image
          alt={`${imovel.titulo} — ${imovel.bairro}, Londrina`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          src={image}
        />
        <span className="absolute left-3.5 top-3.5 border border-white/40 px-2.5 py-[5px] text-[8px] uppercase tracking-[0.3em] text-white">
          {imovel.tag}
        </span>
      </div>
      <div className="pt-3.5">
        <p className="mb-1 text-[11px] tracking-[0.06em] text-navy">
          {imovel.bairro}, Londrina
        </p>
        <h3 className="mb-2.5 text-[15px] font-normal leading-[1.3] text-navy">
          {imovel.titulo}
        </h3>
        <div className="flex items-baseline justify-between gap-4 border-t border-navy/10 pt-2.5">
          <span className="text-[11px] text-navy">
            {area(imovel.area)}
            {imovel.suites && imovel.suites > 0 ? ` · ${imovel.suites} suítes` : ""}
          </span>
          <span className="shrink-0 text-[17px] font-medium text-navy">{currency(price)}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function BairroPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getBairroPageData(slug);
  if (!data) notFound();

  const { bairro, imoveis, outrosBairros } = data;
  const faqSchema = faqJsonLd(bairro);

  return (
    <main className="bg-offwhite text-navy">
      {faqSchema ? (
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          type="application/ld+json"
        />
      ) : null}
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bairro)) }}
        type="application/ld+json"
      />

      <section className="relative flex h-[52vh] min-h-[340px] items-end bg-navy md:h-[66vh] md:min-h-[480px]">
        {bairro.heroImage ? (
          <Image
            alt={`Vista do bairro ${bairro.nome}, Londrina`}
            className="absolute inset-0 h-full w-full object-cover"
            fill
            priority
            sizes="100vw"
            src={imageUrlOrFallback(bairro.heroImage)}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/5 to-navy/80" />
        <div className="site-container relative z-10 w-full pb-8 md:pb-14">
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-terra-light">
            Conheça o bairro
          </p>
          <h1 className="text-[clamp(28px,9vw,40px)] font-light leading-[1.1] tracking-[0.01em] text-white md:text-[clamp(36px,4.5vw,58px)]">
            Imóveis de Alto Padrão em
            <br />
            {bairro.nome}, Londrina
          </h1>
        </div>
      </section>

      <section className="site-container grid grid-cols-1 gap-8 border-b border-navy/10 py-10 md:grid-cols-[1.7fr_1fr] md:gap-20 md:py-[72px]">
        <div>
          {bairro.descricao ? (
            <p className="mb-6 max-w-[720px] whitespace-pre-line text-sm leading-[1.85] text-[#4a4a48]">
              {bairro.descricao}
            </p>
          ) : null}
          <Link
            className="inline-block border border-navy px-7 py-[13px] text-[10px] uppercase tracking-[0.2em] text-navy transition hover:bg-navy hover:text-white"
            href={`/imoveis?bairro=${encodeURIComponent(bairro.nome)}`}
          >
            Ver os {bairro.imoveisDisponiveis} imóveis do bairro
          </Link>
        </div>

        <div className="flex flex-row flex-wrap gap-5 md:flex-col md:gap-7">
          {[
            { value: currency(bairro.valorMedioVenda), label: "Valor médio de venda" },
            { value: String(bairro.imoveisDisponiveis), label: "Imóveis premium disponíveis" },
          ].map((fact) => (
            <div className="flex-1 md:border-b md:border-navy/10 md:pb-6" key={fact.label}>
              <p className="mb-1 text-2xl font-light text-navy md:text-[32px]">{fact.value}</p>
              <p className="text-[9px] uppercase leading-[1.4] tracking-[0.04em] text-navy md:text-[10.5px]">
                {fact.label}
              </p>
            </div>
          ))}
          {/* Futuro: calcular valorização histórica comparando snapshots de sincronizacoes_log ao longo do tempo. */}
        </div>
      </section>

      <section className="site-container bg-white py-10 md:py-16">
        <div className="mb-7 flex flex-col items-start justify-between gap-2.5 md:mb-9 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
              {bairro.nome}
            </p>
            <h2 className="text-[22px] font-light tracking-[0.01em] md:text-3xl">
              Imóveis disponíveis no bairro
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {imoveis.map((imovel) => (
            <ImovelCard imovel={imovel} key={imovel.codigo} />
          ))}
        </div>
      </section>

      {bairro.faq.length > 0 ? (
        <section className="site-container border-t border-navy/10 py-10 md:py-16">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
            Perguntas frequentes
          </p>
          <h2 className="mb-7 text-[22px] font-light tracking-[0.01em] md:text-3xl">
            Sobre {bairro.nome}
          </h2>
          <div className="divide-y divide-navy/10 border-y border-navy/10">
            {bairro.faq.map((item) => (
              <div className="py-5" key={item.question}>
                <h3 className="mb-2 text-base font-normal text-navy">{item.question}</h3>
                <p className="max-w-3xl text-sm leading-[1.8] text-[#4a4a48]">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="site-container py-10 md:py-16">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
          Explore mais
        </p>
        <h2 className="mb-6 text-[22px] font-light tracking-[0.01em] md:mb-8 md:text-3xl">
          Outros bairros de alto padrão em Londrina
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-1">
          {outrosBairros.map((other) => (
            <Link
              className="group relative block aspect-[16/10] overflow-hidden bg-navy no-underline md:aspect-[4/5]"
              href={`/bairros/${other.slug}`}
              key={other.slug}
            >
              {other.image ? (
                <Image
                  alt={`Bairro ${other.nome}, Londrina`}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  src={imageUrlOrFallback(other.image)}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-navy/85" />
              <div className="absolute inset-x-[18px] bottom-[18px]">
                <p className="mb-1 text-[8px] uppercase tracking-[0.25em] text-terra-light">
                  {other.imoveisDisponiveis} imóveis
                </p>
                <p className="text-lg font-normal text-white">{other.nome}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
