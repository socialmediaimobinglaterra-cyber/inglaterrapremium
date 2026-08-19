import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LancamentoGallery } from "@/components/lancamentos/LancamentoGallery";
import {
  getLancamentoBySlug,
  getRelatedLancamentos,
  type LancamentoDetail,
  type LancamentoResumo,
} from "@/lib/queries/lancamentos";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function statusClass(status: string | null) {
  if (status === "Últimas Unidades") return "bg-terra";
  if (status === "Em Obras") return "bg-sand";
  return "bg-navy";
}

function metadataDescription(lancamento: LancamentoDetail) {
  return [
    lancamento.nome,
    `lançamento em ${lancamento.bairro}, ${lancamento.cidade}`,
    lancamento.faixa,
    lancamento.metragens,
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lancamento = await getLancamentoBySlug(slug);

  if (!lancamento) {
    return {
      title: "Lançamento não encontrado | Inglaterra Premium",
    };
  }

  const title = `${lancamento.nome} | Inglaterra Premium`;
  const description = metadataDescription(lancamento);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: lancamento.image
        ? [{ url: lancamento.image, alt: lancamento.nome }]
        : undefined,
    },
  };
}

function EmptyImage({ nome }: { nome: string }) {
  return (
    <div className="flex h-full min-h-[260px] items-center justify-center border border-dashed border-navy/10 bg-white text-center text-xs leading-relaxed text-sand">
      Imagem de {nome} aguardando cadastro.
    </div>
  );
}

function RelatedCard({ lancamento }: { lancamento: LancamentoResumo }) {
  return (
    <Link
      className="group block text-inherit no-underline"
      href={`/lancamentos/${lancamento.slug}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[#1e1e1e]">
        {lancamento.image ? (
          <img
            alt={`${lancamento.nome} - lançamento em ${lancamento.bairro}, Londrina`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            src={lancamento.image}
            style={{ objectPosition: lancamento.imagePosition }}
          />
        ) : (
          <EmptyImage nome={lancamento.nome} />
        )}
        {lancamento.status ? (
          <span
            className={`absolute left-3.5 top-3.5 px-2.5 py-[5px] text-[8px] font-semibold uppercase tracking-[0.2em] text-white ${statusClass(
              lancamento.status
            )}`}
          >
            {lancamento.status}
          </span>
        ) : null}
      </div>
      <div className="pt-3.5">
        <p className="mb-1 text-[11px] tracking-[0.06em] text-sand">
          {lancamento.bairro}, Londrina
        </p>
        <h3 className="text-[15px] font-normal leading-[1.3] text-navy">
          {lancamento.nome}
        </h3>
      </div>
    </Link>
  );
}

function ContactField({ placeholder }: { placeholder: string }) {
  return (
    <input
      className="border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/40"
      placeholder={placeholder}
    />
  );
}

function JsonLd({ lancamento }: { lancamento: LancamentoDetail }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: lancamento.nome,
    description: lancamento.descricao,
    url: `/lancamentos/${lancamento.slug}`,
    image: [lancamento.capa?.url, ...lancamento.galeria.map((foto) => foto.url)].filter(Boolean),
    address: {
      "@type": "PostalAddress",
      streetAddress: lancamento.endereco ?? undefined,
      addressLocality: lancamento.cidade,
      addressRegion: lancamento.estado,
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

export default async function LancamentoPage({ params }: PageProps) {
  const { slug } = await params;
  const lancamento = await getLancamentoBySlug(slug);
  if (!lancamento) notFound();

  const relacionados = await getRelatedLancamentos(lancamento.slug);
  const facts = [
    lancamento.metragens ? { value: lancamento.metragens, label: "Metragens" } : null,
    lancamento.faixa ? { value: lancamento.faixa, label: "Valores" } : null,
    lancamento.unidades ? { value: lancamento.unidades, label: "Unidades por andar" } : null,
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  return (
    <main className="bg-offwhite text-navy">
      <JsonLd lancamento={lancamento} />

      <div className="site-container pt-[88px] md:pt-[108px]">
        <p className="mb-4 text-[11px] text-sand">
          Início / Lançamentos / {lancamento.nome}
        </p>
        {lancamento.status ? (
          <span
            className={`mb-4 inline-block px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white ${statusClass(
              lancamento.status
            )}`}
          >
            {lancamento.status}
          </span>
        ) : null}
        <h1 className="mb-2.5 max-w-[700px] text-[clamp(26px,8vw,34px)] font-light leading-[1.15] tracking-[0.01em] md:text-[clamp(32px,3.6vw,48px)]">
          {lancamento.nome} - Lançamento em {lancamento.bairro}, Londrina
        </h1>
        {lancamento.entrega ? (
          <p className="text-[13px] text-sand">{lancamento.entrega}</p>
        ) : null}
      </div>

      <div className="site-container pt-5 md:pt-7">
        <div className="aspect-[4/3] overflow-hidden md:aspect-[21/9]">
          {lancamento.image ? (
            <img
              alt={`${lancamento.nome} - perspectiva principal, ${lancamento.bairro}, Londrina`}
              className="h-full w-full object-cover"
              src={lancamento.image}
              style={{ objectPosition: lancamento.imagePosition }}
            />
          ) : (
            <EmptyImage nome={lancamento.nome} />
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
                <p className="text-[8.5px] uppercase tracking-[0.05em] text-sand md:text-[10px]">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(lancamento.descricao || lancamento.descricao2 || lancamento.diferenciais.length > 0) ? (
        <section className="site-container grid grid-cols-1 gap-7 py-10 md:grid-cols-[1.6fr_1fr] md:gap-16 md:py-16">
          {(lancamento.descricao || lancamento.descricao2) ? (
            <div>
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Sobre o lançamento
              </h2>
              {lancamento.descricao ? (
                <p className="mb-4 max-w-[620px] whitespace-pre-line text-sm leading-[1.85] text-[#4a4a48]">
                  {lancamento.descricao}
                </p>
              ) : null}
              {lancamento.descricao2 ? (
                <p className="max-w-[620px] text-sm leading-[1.85] text-[#4a4a48]">
                  {lancamento.descricao2}
                </p>
              ) : null}
            </div>
          ) : null}

          {lancamento.diferenciais.length > 0 ? (
            <div>
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Diferenciais
              </h2>
              <div className="flex flex-col gap-2.5">
                {lancamento.diferenciais.map((item) => (
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

      <section className="site-container pb-10 md:pb-16">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
          Galeria de fotos
        </h2>
        <LancamentoGallery images={lancamento.galeria} nome={lancamento.nome} />
      </section>

      <section className="site-container grid grid-cols-1 gap-7 bg-white py-10 md:grid-cols-[1.6fr_1fr] md:gap-16 md:py-16">
        <div>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Localização
          </h2>
          <p className="mb-4 text-[13px] text-sand">
            {lancamento.bairro}, Londrina - PR
          </p>
          <div className="flex h-[200px] items-center justify-center border border-dashed border-navy/10 bg-offwhite text-center text-xs leading-relaxed text-sand md:h-[300px]">
            {lancamento.latitude && lancamento.longitude
              ? `${lancamento.latitude}, ${lancamento.longitude} - ${lancamento.bairro}, Londrina`
              : `${lancamento.bairro}, Londrina - PR`}
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

      {relacionados.length > 0 ? (
        <section className="site-container py-12 md:py-[72px]">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
            Continue explorando
          </p>
          <h2 className="mb-6 text-[22px] font-light tracking-[0.01em] md:mb-8 md:text-[28px]">
            Quem viu este lançamento também viu
          </h2>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-3 md:gap-8">
            {relacionados.map((item) => (
              <RelatedCard key={item.id} lancamento={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
