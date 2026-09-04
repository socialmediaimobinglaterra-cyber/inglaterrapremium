import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { PropertyContactButton } from "@/components/analytics/PropertyContactButton";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { imageUrlOrFallback } from "@/lib/images";
import { absoluteUrl } from "@/lib/site";
import {
  getImovelBySlug,
  getSimilarImoveis,
  type ImovelDetail,
  type ImovelSearchResult,
} from "@/lib/queries/imoveis";

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

function getPrice(imovel: ImovelDetail) {
  return imovel.precoVenda ?? imovel.precoLocacao;
}

function getTransactionLabel(imovel: ImovelDetail) {
  if (imovel.precoVenda && imovel.precoLocacao) return "Venda · Locação";
  if (imovel.precoLocacao) return "Locação";
  return "Venda";
}

function getAddress(imovel: ImovelDetail) {
  const street = [imovel.endereco, imovel.numero].filter(Boolean).join(", ");
  return [street, imovel.bairro, imovel.cidade, imovel.estado]
    .filter(Boolean)
    .join(" — ");
}

function getGallery(imovel: ImovelDetail) {
  if (imovel.fotos.length > 0) return imovel.fotos;
  return [{ url: "/images/capa-hero.jpg", alt: imovel.titulo, principal: true }];
}

function plainDescription(imovel: ImovelDetail) {
  return (
    imovel.descricao
      ?.replace(/#[^\s#]+/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim() ?? ""
  );
}

function whatsappHref(imovel: ImovelDetail) {
  const phone = (imovel.corretor.celular ?? imovel.corretor.telefone ?? "").replace(/\D/g, "");
  if (!phone) return null;

  const number = phone.startsWith("55") ? phone : `55${phone}`;
  const message = encodeURIComponent(
    `Tenho interesse no imóvel "${imovel.titulo}". Gostaria de agendar uma visita.`
  );

  return `https://wa.me/${number}?text=${message}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractDifferentials(description: string | null) {
  if (!description) return [];
  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const start = lines.findIndex((line) => /diferenciais/i.test(line));
  const end = lines.findIndex(
    (line, index) => index > start && /estrutura|localização|localizacao|agende/i.test(line)
  );
  const selected = start >= 0 ? lines.slice(start + 1, end > start ? end : undefined) : lines;

  return selected
    .filter((line) => line.startsWith("*") || line.startsWith("-") || line.startsWith("•"))
    .map((line) => line.replace(/^[*\-•]\s*/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .slice(0, 6);
}

function metadataDescription(imovel: ImovelDetail) {
  const price = getPrice(imovel);
  const bits = [
    imovel.tipo,
    imovel.bairro,
    imovel.area ? area(imovel.area) : null,
    imovel.suites ? `${imovel.suites} suítes` : null,
    price ? currency(price) : null,
  ].filter(Boolean);
  return `${bits.join(" · ")}. Imóvel premium em ${imovel.cidade}, ${imovel.estado}, com curadoria Inglaterra Premium.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const imovel = await getImovelBySlug(slug);

  if (!imovel) {
    return {
      title: "Imóvel não encontrado | Inglaterra Premium",
    };
  }

  const gallery = getGallery(imovel);
  const title = `${imovel.titulo} | Inglaterra Premium`;
  const description = metadataDescription(imovel);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: gallery[0]?.url ? [{ url: gallery[0].url, alt: imovel.titulo }] : undefined,
    },
  };
}

function SimilarCard({ imovel }: { imovel: ImovelSearchResult }) {
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
        <h3 className="mb-2 text-[15px] font-normal leading-[1.3] text-navy">
          {imovel.titulo}
        </h3>
        <p className="text-base font-medium text-navy">{currency(price)}</p>
      </div>
    </Link>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        className="w-full border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/40"
        placeholder={placeholder}
      />
    </label>
  );
}

function jsonLd(imovel: ImovelDetail) {
  const price = getPrice(imovel);
  const gallery = getGallery(imovel);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: imovel.titulo,
    description: plainDescription(imovel).slice(0, 1200),
    url: `/imoveis/${imovel.slug}`,
    image: gallery.map((foto) => foto.url).slice(0, 10),
    address: {
      "@type": "PostalAddress",
      streetAddress: [imovel.endereco, imovel.numero].filter(Boolean).join(", "),
      addressLocality: imovel.cidade,
      addressRegion: imovel.estado,
      addressCountry: "BR",
    },
    floorSize: imovel.area
      ? {
          "@type": "QuantitativeValue",
          value: imovel.area,
          unitCode: "MTK",
        }
      : undefined,
    numberOfBedrooms: imovel.dormitorios ?? undefined,
    numberOfBathroomsTotal: imovel.banheiros ?? undefined,
    offers: price
      ? {
          "@type": "Offer",
          price,
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
          businessFunction: imovel.precoLocacao
            ? "https://purl.org/goodrelations/v1#LeaseOut"
            : "https://purl.org/goodrelations/v1#Sell",
        }
      : undefined,
  };
}

function breadcrumbJsonLd(imovel: ImovelDetail) {
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
        name: "Imóveis",
        item: absoluteUrl("/imoveis"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: imovel.bairro,
        item: absoluteUrl(`/bairros/${slugify(imovel.bairro)}`),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: imovel.titulo,
        item: absoluteUrl(`/imoveis/${imovel.slug}`),
      },
    ],
  };
}

export default async function ImovelPage({ params }: PageProps) {
  const { slug } = await params;
  const imovel = await getImovelBySlug(slug);
  if (!imovel) notFound();

  after(() =>
    recordAnalyticsEvent({
      tipoEvento: "visualizacao_imovel",
      imovelId: imovel.id,
      payload: {
        bairro: imovel.bairro,
        tipo: imovel.tipo,
      },
    })
  );

  const [similares, gallery] = await Promise.all([
    getSimilarImoveis(imovel),
    Promise.resolve(getGallery(imovel)),
  ]);
  const description = plainDescription(imovel);
  const differentials = extractDifferentials(imovel.descricao);
  const corretor = imovel.corretor;
  const contactWhatsappHref = whatsappHref(imovel);
  const mainImage = imageUrlOrFallback(gallery[0]?.url);

  return (
    <main className="bg-offwhite text-navy">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(imovel)) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(imovel)) }}
        type="application/ld+json"
      />

      <div className="site-container pt-[88px] md:pt-[108px]">
        <p className="text-[11px] text-navy">
          Início / Imóveis / {imovel.bairro} / {imovel.titulo}
        </p>
      </div>

      <section className="site-container pt-5">
        <div className="md:grid md:h-[560px] md:grid-cols-[1.7fr_1fr] md:gap-2">
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
            <Image
              alt={`${imovel.titulo} — foto principal`}
              className="h-full w-full object-cover"
              fill
              priority
              sizes="(min-width: 768px) 63vw, 100vw"
              src={mainImage}
            />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 md:mt-0 md:grid-cols-2 md:grid-rows-2 md:gap-2">
            {gallery.slice(1, 5).map((foto, index) => (
              <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto" key={foto.url}>
                <Image
                  alt={foto.alt ?? `${imovel.titulo} — foto ${index + 2}`}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(min-width: 768px) 19vw, 25vw"
                  src={imageUrlOrFallback(foto.url)}
                />
                {index === 3 && gallery.length > 5 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-navy/60 text-[13px] font-medium text-white">
                    + {gallery.length - 5} fotos
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="site-container grid grid-cols-1 gap-10 py-8 md:grid-cols-[1.6fr_1fr] md:gap-[72px] md:py-14">
        <div>
          <div className="mb-6 border-b border-navy/10 pb-6 md:mb-8 md:pb-8">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-terra">
              {imovel.tipo ?? "Imóvel"} · {getTransactionLabel(imovel)}
            </p>
            <h1 className="mb-3 max-w-[620px] text-[clamp(24px,7vw,30px)] font-light leading-[1.15] tracking-[0.01em] md:text-[clamp(28px,3vw,40px)]">
              {imovel.titulo}
            </h1>
            <p className="mb-5 text-[13px] text-navy">{getAddress(imovel)}</p>
            <p className="text-2xl font-medium text-navy md:text-3xl">
              {currency(getPrice(imovel))}
            </p>
          </div>

          <div className="mb-8 grid grid-cols-4 gap-2 md:mb-11 md:gap-4">
            {[
              { value: area(imovel.area ?? imovel.areaTotal), label: "Área privativa" },
              { value: imovel.suites ?? "—", label: "Suítes" },
              { value: imovel.vagas ?? "—", label: "Vagas" },
              { value: imovel.banheiros ?? "—", label: "Banheiros" },
            ].map((fact) => (
              <div className="bg-white px-2 py-3.5 text-center md:px-4 md:py-5" key={fact.label}>
                <p className="mb-1 text-lg font-light text-navy md:text-2xl">{fact.value}</p>
                <p className="text-[8.5px] uppercase tracking-[0.05em] text-navy md:text-[10px]">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>

          <section className="mb-8 md:mb-11">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
              Sobre o imóvel
            </h2>
            <p className="max-w-[680px] whitespace-pre-line text-sm leading-[1.85] text-[#4a4a48]">
              {description}
            </p>
          </section>

          {differentials.length > 0 ? (
            <section className="mb-8 md:mb-11">
              <h2 className="mb-[18px] text-[11px] font-semibold uppercase tracking-[0.16em]">
                Diferenciais
              </h2>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-x-7 md:gap-y-3.5">
                {differentials.map((item) => (
                  <div
                    className="flex items-center gap-2.5 border-b border-navy/10 pb-2.5 text-[13px] text-navy"
                    key={item}
                  >
                    <div className="h-1 w-1 shrink-0 bg-terra" />
                    {item}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
              Localização
            </h2>
            <div className="flex h-[200px] items-center justify-center border border-dashed border-navy/10 bg-white text-center text-xs leading-relaxed text-navy md:h-[260px]">
              {imovel.latitude && imovel.longitude
                ? `${imovel.latitude}, ${imovel.longitude} — ${imovel.bairro}, Londrina`
                : `${getAddress(imovel)}`}
            </div>
          </section>
        </div>

        <aside>
          <div className="bg-navy p-6 md:sticky md:top-[100px] md:p-8">
            <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-terra-light">
              Fale com uma especialista
            </p>
            <div className="mb-6 flex items-center gap-3.5 border-b border-white/15 pb-6">
              {corretor.foto ? (
                <img
                  alt={corretor.nome ?? "Contato Inglaterra Premium"}
                  className="h-[52px] w-[52px] shrink-0 rounded-full object-cover"
                  src={imageUrlOrFallback(corretor.foto)}
                />
              ) : (
                <div className="h-[52px] w-[52px] shrink-0 rounded-full bg-white/10" />
              )}
              <div>
                <p className="text-[14.5px] font-medium text-white">
                  {corretor.nome ?? "Inglaterra Premium"}
                </p>
                <p className="text-[11.5px] text-white/50">
                  {corretor.telefone || corretor.celular || corretor.email || imovel.bairro}
                </p>
              </div>
            </div>
            <form className="flex flex-col gap-3.5">
              <Field label="Seu nome" placeholder="Seu nome" />
              <Field label="WhatsApp" placeholder="WhatsApp" />
              <label className="block">
                <span className="sr-only">Mensagem</span>
                <textarea
                  className="w-full resize-none border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none"
                  defaultValue={`Tenho interesse no imóvel "${imovel.titulo}". Gostaria de agendar uma visita.`}
                  rows={3}
                />
              </label>
              <PropertyContactButton
                imovelId={imovel.id}
                whatsappHref={contactWhatsappHref}
              />
            </form>
          </div>
        </aside>
      </div>

      <section className="site-container bg-white py-12 md:py-[72px]">
        <div className="mb-7 flex flex-col items-start justify-between gap-2.5 md:mb-9 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
              Você também pode gostar
            </p>
            <h2 className="text-[22px] font-light tracking-[0.01em] md:text-[28px]">
              Imóveis semelhantes em Londrina
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {similares.map((similar) => (
            <SimilarCard imovel={similar} key={similar.codigo} />
          ))}
        </div>
      </section>
    </main>
  );
}
