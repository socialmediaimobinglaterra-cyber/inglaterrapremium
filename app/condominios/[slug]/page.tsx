import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CondominioGallery } from "@/components/condominios/CondominioGallery";
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
    <div className="flex h-full min-h-[260px] items-center justify-center border border-dashed border-navy/10 bg-white text-center text-xs leading-relaxed text-navy">
      Imagem do condomínio {nome} aguardando cadastro.
    </div>
  );
}

function ContactField({ placeholder }: { placeholder: string }) {
  return (
    <input
        className="border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/75"
      placeholder={placeholder}
    />
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
      className="group block text-inherit no-underline"
      href={`/imoveis/${imovel.slug}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[#1e1e1e]">
        <img
          alt={`${imovel.titulo} - Condomínio ${condominio}, Londrina`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          src={imovel.image}
        />
        <span className="absolute left-3.5 top-3.5 border border-white/40 px-2.5 py-[5px] text-[8px] uppercase tracking-[0.2em] text-white">
          {imovel.tag}
        </span>
      </div>
      <div className="pt-3.5">
        <p className="mb-1 text-[11px] tracking-[0.06em] text-navy">
          {condominio}, {imovel.bairro}
        </p>
        <h3 className="mb-2.5 text-[15px] font-normal leading-[1.3] text-navy">
          {imovel.titulo}
        </h3>
        <div className="flex items-baseline justify-between border-t border-navy/10 pt-2.5">
          <span className="text-[11px] text-navy">{formatArea(imovel.area) ?? imovel.tipo}</span>
          <span className="text-[17px] font-medium text-navy">
            {formatCurrency(imovel.precoVenda ?? imovel.precoLocacao)}
          </span>
        </div>
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
        <span className="absolute left-3.5 top-3.5 bg-navy px-2.5 py-[5px] text-[8px] font-semibold uppercase tracking-[0.2em] text-white">
          Condomínio
        </span>
      </div>
      <div className="pt-3.5">
        <p className="mb-1 text-[11px] tracking-[0.06em] text-navy">
          {condominio.bairro}, Londrina
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
      : condominio.imoveisCount > 0
        ? {
            value: `${condominio.imoveisCount} ${condominio.imoveisCount === 1 ? "imóvel" : "imóveis"}`,
            label: "Imóveis disponíveis",
          }
        : null,
    condominio.areaTotal ? { value: condominio.areaTotal, label: "Área total" } : null,
    condominio.seguranca ? { value: condominio.seguranca, label: "Segurança" } : null,
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  return (
    <main className="bg-offwhite text-navy">
      <JsonLd condominio={condominio} />

      <div className="site-container pt-[88px] md:pt-[108px]">
        <p className="mb-4 text-[11px] text-navy">
          Início / Condomínios / {condominio.nome}
        </p>
        <span className="mb-4 inline-block bg-navy px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white">
          Condomínio Fechado
        </span>
        <h1 className="mb-2.5 max-w-[700px] text-[clamp(26px,8vw,34px)] font-light leading-[1.15] tracking-[0.01em] md:text-[clamp(32px,3.6vw,48px)]">
          Condomínio {condominio.nome} em {condominio.bairro}, Londrina
        </h1>
        {(condominio.seguranca || condominio.unidades) ? (
              <p className="text-[13px] text-navy">
            {[condominio.seguranca, condominio.unidades].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="site-container pt-5 md:pt-7">
        <div className="aspect-[4/3] overflow-hidden md:aspect-[21/9]">
          {condominio.image ? (
            <img
              alt={`Condomínio ${condominio.nome} - vista geral, ${condominio.bairro}, Londrina`}
              className="h-full w-full object-cover"
              src={condominio.image}
            />
          ) : (
            <EmptyImage nome={condominio.nome} />
          )}
        </div>
      </div>

      {facts.length > 0 ? (
        <div className="site-container pt-6">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4">
            {facts.map((fact) => (
              <div className="bg-white px-2 py-3.5 text-center md:px-4 md:py-5" key={fact.label}>
                <p className="mb-1 text-[13px] font-medium text-navy md:text-[17px]">
                  {fact.value}
                </p>
                <p className="text-[8.5px] uppercase tracking-[0.05em] text-navy md:text-[10px]">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(condominio.descricao || condominio.descricao2 || condominio.diferenciais.length > 0) ? (
        <section className="site-container grid grid-cols-1 gap-7 py-10 md:grid-cols-[1.6fr_1fr] md:gap-16 md:py-16">
          {(condominio.descricao || condominio.descricao2) ? (
            <div>
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
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
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Infraestrutura
              </h2>
              <div className="flex flex-col gap-2.5">
                {condominio.diferenciais.map((item) => (
                  <div
                    className="flex items-center gap-2.5 border-b border-navy/10 pb-2.5 text-[13px] text-navy"
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

      <section className="site-container pb-10 pt-10 md:pb-16 md:pt-16">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
          Galeria de fotos
        </h2>
        <CondominioGallery images={condominio.galeria} nome={condominio.nome} />
      </section>

      <section className="site-container grid grid-cols-1 gap-7 bg-white py-10 md:grid-cols-[1.6fr_1fr] md:gap-16 md:py-16">
        <div>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Localização
          </h2>
            <p className="mb-4 text-[13px] text-navy">
            {condominio.bairro}, Londrina - PR
          </p>
            <div className="flex h-[200px] items-center justify-center border border-dashed border-navy/10 bg-offwhite text-center text-xs leading-relaxed text-navy md:h-[300px]">
            {condominio.latitude && condominio.longitude
              ? `${condominio.latitude}, ${condominio.longitude} - ${condominio.bairro}, Londrina`
              : `${condominio.bairro}, Londrina - PR`}
          </div>
        </div>

        <div className="bg-navy p-6 md:p-8">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-terra-light">
            Quero receber informações
          </p>
          <form className="flex flex-col gap-3.5">
            <ContactField placeholder="Seu nome" />
            <ContactField placeholder="WhatsApp" />
            <ContactField placeholder="E-mail" />
            <button
              className="mt-1 bg-terra p-3.5 text-[10px] uppercase tracking-[0.2em] text-white"
              type="button"
            >
              Quero saber mais
            </button>
          </form>
        </div>
      </section>

      {imoveis.length > 0 ? (
        <section className="site-container py-12 md:py-[72px]">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
            {condominio.nome}
          </p>
          <h2 className="mb-6 text-[22px] font-light tracking-[0.01em] md:mb-8 md:text-[28px]">
            Imóveis disponíveis neste condomínio
          </h2>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-3 md:gap-8">
            {imoveis.map((imovel) => (
              <ImovelCard condominio={condominio.nome} imovel={imovel} key={imovel.slug} />
            ))}
          </div>
        </section>
      ) : null}

      {relacionados.length > 0 ? (
        <section className="site-container py-12 md:py-[72px]">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
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
