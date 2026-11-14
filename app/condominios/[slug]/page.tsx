import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CondominioGallery } from "@/components/condominios/CondominioGallery";
import { DevelopmentContact } from "@/components/contact/DevelopmentContact";
import {
  getCondominioBySlug,
  getCondominioImoveis,
  getRelatedCondominios,
  type CondominioDetail,
  type CondominioResumo,
} from "@/lib/queries/condominios";
import type { ImovelSearchResult } from "@/lib/queries/imoveis";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function metadataDescription(condominio: CondominioDetail) {
  return [
    `Condomínio ${condominio.nome}`,
    condominio.bairro ? `${condominio.bairro}, ${condominio.cidade}` : condominio.cidade,
    condominio.imoveisCount > 0
      ? `${condominio.imoveisCount} imóveis disponíveis`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const condominio = await getCondominioBySlug(slug);

  if (!condominio) {
    return {
      title: "Condomínio não encontrado | Inglaterra Premium",
    };
  }

  const title = `Condomínio ${condominio.nome} | Inglaterra Premium`;
  const description = metadataDescription(condominio);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: condominio.image
        ? [{ url: condominio.image, alt: condominio.nome }]
        : undefined,
    },
  };
}

function EmptyImage({ nome }: { nome: string }) {
  return (
    <div className="flex h-full min-h-[260px] items-center justify-center border border-dashed border-navy/10 bg-white text-center text-detail leading-relaxed text-navy">
      Imagem do condomínio {nome} aguardando cadastro.
    </div>
  );
}

function formatCurrency(value: number | null) {
  if (value === null) return "Consulte";

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function formatArea(value: number | null) {
  if (value === null) return null;
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;
}

function ImovelCard({ imovel, condominio }: { imovel: ImovelSearchResult; condominio: string }) {
  return (
    <Link
      className="group grid items-center gap-6 text-inherit no-underline md:grid-cols-[1.2fr_1fr] md:gap-12 lg:gap-16"
      href={`/imoveis/${imovel.slug}`} target="_blank" rel="noopener noreferrer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1e1e1e]">
        <Image
          alt={`${imovel.titulo} - Condomínio ${condominio}, Londrina`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          fill
          sizes="(min-width: 768px) 55vw, 100vw"
          src={imovel.image}
        />
        <span className="absolute left-3.5 top-3.5 border border-white/40 px-2.5 py-[5px] text-caption uppercase tracking-[0.2em] text-white">
          {imovel.tag}
        </span>
      </div>
      <div className="min-w-0 py-1 md:py-5">
        {imovel.codigo ? <p className="mb-1.5 text-detail text-navy">Ref. {imovel.codigo}</p> : null}
        <p className="mb-1 text-detail tracking-[0.06em] text-navy">
          {condominio}, {imovel.bairro}
        </p>
        <h3 className="mb-6 break-words text-[22px] font-light leading-[1.3] text-navy md:text-[28px]">
          {imovel.titulo}
        </h3>
        <p className="border-y border-navy/10 py-4 text-copy leading-relaxed text-navy">
          {[formatArea(imovel.area) ?? imovel.tipo,
            imovel.dormitorios ? `${imovel.dormitorios} quartos` : null,
            imovel.suites ? `${imovel.suites} suítes` : null,
            imovel.vagas ? `${imovel.vagas} vagas` : null].filter(Boolean).join(" · ")}
        </p>
        <div className="my-6 flex flex-wrap gap-x-8 gap-y-3">
          {imovel.precoVenda !== null && <p className="text-[22px] font-light"><span className="mb-1 block text-detail font-normal">Venda</span>{formatCurrency(imovel.precoVenda)}</p>}
          {imovel.precoLocacao !== null && <p className="text-[22px] font-light"><span className="mb-1 block text-detail font-normal">Locação / mês</span>{formatCurrency(imovel.precoLocacao)}</p>}
          {imovel.precoVenda === null && imovel.precoLocacao === null && <p className="text-[22px] font-light">Consulte</p>}
        </div>
        <span className="inline-block border-b border-terra pb-1 text-caption uppercase tracking-[0.2em] text-terra">Conhecer imóvel</span>
      </div>
    </Link>
  );
}

function RelatedCard({ condominio }: { condominio: CondominioResumo }) {
  return (
    <Link
      className="group block text-inherit no-underline"
      href={`/condominios/${condominio.slug}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[#1e1e1e]">
        {condominio.image ? (
          <img
            alt={`Condomínio ${condominio.nome} - ${condominio.bairro}, Londrina`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            src={condominio.image}
          />
        ) : (
          <EmptyImage nome={condominio.nome} />
        )}
        <span className="absolute left-3.5 top-3.5 bg-navy px-2.5 py-[5px] text-caption font-semibold uppercase tracking-[0.2em] text-white">
          Condomínio
        </span>
      </div>
      <div className="pt-3.5">
        <p className="mb-1 text-detail tracking-[0.06em] text-navy">
          {condominio.bairro}, {condominio.cidade}
        </p>
        <h3 className="text-[15px] font-normal leading-[1.3] text-navy">
          {condominio.nome}
        </h3>
      </div>
    </Link>
  );
}

function JsonLd({ condominio }: { condominio: CondominioDetail }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `Condomínio ${condominio.nome}`,
    description: condominio.descricao ?? metadataDescription(condominio),
    url: `/condominios/${condominio.slug}`,
    image: condominio.galeria.map((foto) => foto.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: condominio.endereco ?? undefined,
      addressLocality: condominio.cidade,
      addressRegion: condominio.estado,
      addressCountry: "BR",
    },
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      type="application/ld+json"
    />
  );
}

export default async function CondominioPage({ params }: PageProps) {
  const { slug } = await params;
  const condominio = await getCondominioBySlug(slug);
  if (!condominio) notFound();

  const [imoveis, relacionados] = await Promise.all([
    getCondominioImoveis(condominio),
    getRelatedCondominios(condominio.slug),
  ]);
  const facts = [
    condominio.unidades
      ? { value: condominio.unidades, label: "Unidades" }
      : null,
    condominio.areaTotal ? { value: condominio.areaTotal, label: "Área total" } : null,
    condominio.seguranca ? { value: condominio.seguranca, label: "Segurança" } : null,
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  return (
    <main className="bg-offwhite text-navy">
      <JsonLd condominio={condominio} />

      <div className="site-container pt-[88px] md:pt-[108px]">
        <p className="mb-4 text-detail text-navy">
          Início / Condomínios / {condominio.nome}
        </p>
        <span className="mb-4 inline-block bg-navy px-3 py-1.5 text-caption font-semibold uppercase tracking-[0.15em] text-white">
          Condomínio Fechado
        </span>
        <h1 className="mb-2.5 max-w-[900px] break-words text-[32px] font-light leading-[1.15] md:text-[48px]">
          Condomínio {condominio.nome} em {condominio.bairro}, {condominio.cidade}
        </h1>
        <p className="mt-4 text-copy text-navy">
          {condominio.bairro}, {condominio.cidade} - {condominio.estado}
          <span className="mx-2" aria-hidden="true">·</span>
          <a className="underline decoration-navy/25 underline-offset-4" href="#imoveis-disponiveis">
            {condominio.imoveisCount} {condominio.imoveisCount === 1 ? "imóvel disponível" : "imóveis disponíveis"}
          </a>
        </p>
        {(condominio.seguranca || condominio.unidades) ? (
              <p className="text-copy text-navy">
            {[condominio.seguranca, condominio.unidades].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>

      <section id="imoveis-disponiveis" className="site-container scroll-mt-28 py-12 md:py-[72px]" aria-labelledby="imoveis-title">
        <h2 id="imoveis-title" className="mb-6 text-[22px] font-light md:mb-8 md:text-[28px]">
          Imóveis disponíveis neste condomínio
        </h2>
        {imoveis.length > 0 ? <>
          {condominio.imoveisCount > imoveis.length && <p className="mb-6 text-detail text-navy">Uma seleção de {imoveis.length} dos {condominio.imoveisCount} imóveis disponíveis.</p>}
          <div className="flex flex-col gap-10 md:gap-16">
            {imoveis.map((imovel) => (
              <ImovelCard condominio={condominio.nome} imovel={imovel} key={imovel.slug} />
            ))}
          </div>
        </> : <p className="text-sm text-navy">Não há imóveis disponíveis neste condomínio no momento.</p>}
      </section>

      {facts.length > 0 ? (
        <div className="site-container pt-6">
          <div className="flex flex-wrap gap-x-12 gap-y-6 border-y border-navy/10 py-6">
            {facts.map((fact) => (
              <div key={fact.label}>
                <p className="mb-1 text-copy font-medium text-navy md:text-[17px]">
                  {fact.value}
                </p>
                <p className="text-caption uppercase tracking-[0.05em] text-navy md:text-caption">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(condominio.descricao || condominio.descricao2 || condominio.diferenciais.length > 0) ? (
        <section className={`site-container grid grid-cols-1 gap-7 py-10 md:gap-16 md:py-16 ${(condominio.descricao || condominio.descricao2) && condominio.diferenciais.length > 0 ? "md:grid-cols-[1.6fr_1fr]" : ""}`}>
          {(condominio.descricao || condominio.descricao2) ? (
            <div>
              <h2 className="mb-4 text-detail font-semibold uppercase tracking-[0.16em]">
                Sobre o condomínio
              </h2>
              {condominio.descricao ? (
                <p className="mb-4 max-w-[620px] whitespace-pre-line text-sm leading-[1.85] text-[#4a4a48]">
                  {condominio.descricao}
                </p>
              ) : null}
              {condominio.descricao2 ? (
                <p className="max-w-[620px] text-sm leading-[1.85] text-[#4a4a48]">
                  {condominio.descricao2}
                </p>
              ) : null}
            </div>
          ) : null}

          {condominio.diferenciais.length > 0 ? (
            <div>
              <h2 className="mb-4 text-detail font-semibold uppercase tracking-[0.16em]">
                Infraestrutura
              </h2>
              <div className="flex flex-col gap-2.5">
                {condominio.diferenciais.map((item) => (
                  <div
                    className="flex items-center gap-2.5 border-b border-navy/10 pb-2.5 text-copy text-navy"
                    key={item}
                  >
                    <div className="h-1 w-1 shrink-0 bg-terra" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {condominio.galeriaPropria.length > 0 ? <section className="site-container py-10 md:py-16">
        <h2 className="mb-4 text-detail font-semibold uppercase tracking-[0.16em]">
          Condomínio e áreas comuns
        </h2>
        <CondominioGallery images={condominio.galeriaPropria} nome={condominio.nome} />
      </section> : null}

      <section className="site-container grid grid-cols-1 items-start gap-8 py-10 md:grid-cols-[1.2fr_1fr] md:gap-12 md:py-16 lg:gap-16">
        <div className="min-w-0 border-t border-navy/10 pt-6">
          <h2 className="mb-4 text-detail font-semibold uppercase tracking-[0.16em]">
            Localização
          </h2>
            <p className="mb-4 text-copy text-navy">
            {[condominio.endereco, condominio.bairro, condominio.cidade, condominio.estado].filter(Boolean).join(" · ")}
          </p>
          {condominio.latitude !== null && condominio.longitude !== null && Number.isFinite(condominio.latitude) && Number.isFinite(condominio.longitude) && Math.abs(condominio.latitude) <= 90 && Math.abs(condominio.longitude) <= 180 && (condominio.latitude !== 0 || condominio.longitude !== 0) ? (
            <a className="inline-block border-b border-terra pb-1 text-caption uppercase tracking-[0.2em] text-terra" href={`https://www.openstreetmap.org/?mlat=${condominio.latitude}&mlon=${condominio.longitude}#map=16/${condominio.latitude}/${condominio.longitude}`} target="_blank" rel="noopener noreferrer">Ver localização no mapa</a>
          ) : null}
        </div>

        <div className="min-w-0 bg-navy p-6 md:p-8">
          <p className="mb-5 text-caption font-semibold uppercase tracking-[0.16em] text-terra-light">
            Quero receber informações
          </p>
          <DevelopmentContact nome={condominio.nome} />
        </div>
      </section>

      {relacionados.length > 0 ? (
        <section className="site-container py-12 md:py-[72px]">
          <p className="mb-2 text-caption font-semibold uppercase tracking-[0.25em] text-terra">
            Continue explorando
          </p>
          <h2 className="mb-6 text-[22px] font-light tracking-[0.01em] md:mb-8 md:text-[28px]">
            Outros condomínios
          </h2>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-3 md:gap-8">
            {relacionados.map((item) => (
              <RelatedCard condominio={item} key={item.id} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
