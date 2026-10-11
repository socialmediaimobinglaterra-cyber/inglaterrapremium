import Link from "next/link";
import { CondominioGallery } from "@/components/condominios/CondominioGallery";
import { TipologiasPlantas, type GrupoPlantas } from "@/components/condominios/TipologiasPlantas";
import {
  agruparComodidades,
  formatarPrevisaoEntrega,
  type ItemCatalogo,
} from "@/lib/condominio-secao";
import type { CondominioCompleto, Tipologia } from "@/lib/queries/condominios";

const TITULO = "mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]";

const numero = (valor: number) => valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

function plural(valor: number, singular: string, pluralTexto: string) {
  return `${numero(valor)} ${valor === 1 ? singular : pluralTexto}`;
}

/** Zero é valor válido e aparece; campo ausente (null) não. */
function detalhesTipologia(tipo: Tipologia): string | null {
  const partes = [
    tipo.area !== null ? `${numero(tipo.area)} m²` : null,
    tipo.dormitorios !== null ? plural(tipo.dormitorios, "dormitório", "dormitórios") : null,
    tipo.suites !== null ? plural(tipo.suites, "suíte", "suítes") : null,
    tipo.vagas !== null ? plural(tipo.vagas, "vaga", "vagas") : null,
  ].filter(Boolean);
  return partes.length ? partes.join(" · ") : null;
}

export function ComodidadesLista({
  titulo,
  slugs,
  catalogo,
}: {
  titulo: string;
  slugs: string[];
  catalogo: Map<string, ItemCatalogo>;
}) {
  const grupos = agruparComodidades(slugs, catalogo);
  if (grupos.length === 0) return null;

  return (
    <section className="mb-8 md:mb-11">
      <h2 className={TITULO}>{titulo}</h2>
      <div className="flex flex-col gap-6">
        {grupos.map((grupo) => (
          <div key={grupo.titulo ?? "geral"}>
            {grupo.titulo ? <p className="mb-2.5 text-[12px] font-medium text-navy">{grupo.titulo}</p> : null}
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-x-7 md:gap-y-3.5">
              {grupo.itens.map((item) => (
                <div className="flex items-center gap-2.5 border-b border-navy/10 pb-2.5 text-[13px] text-navy" key={item}>
                  <div className="h-1 w-1 shrink-0 bg-terra" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Seção "O condomínio". Cada bloco só existe se houver dado: nada de título sem
 * conteúdo nem "não informado".
 *  - na página do imóvel: com título/endereço e galeria (padrão);
 *  - na página do condomínio: `comCabecalho` e `comGaleria` desligados (a página já tem os dois).
 */
export function CondominioSecao({
  condominio,
  catalogo,
  comCabecalho = true,
  comGaleria = true,
}: {
  condominio: CondominioCompleto;
  catalogo: Map<string, ItemCatalogo>;
  comCabecalho?: boolean;
  comGaleria?: boolean;
}) {
  const ficha = condominio.ficha;
  const fatos = ficha
    ? ([
        ["Construtora", ficha.construtora],
        ["Arquitetura", ficha.arquitetura],
        ["Torres", ficha.torres !== null ? numero(ficha.torres) : null],
        ["Andares", ficha.andares !== null ? numero(ficha.andares) : null],
        ["Elevadores", ficha.elevadores !== null ? numero(ficha.elevadores) : null],
        ["Total de unidades", ficha.totalUnidades !== null ? numero(ficha.totalUnidades) : null],
        ["Unidades por andar", ficha.unidadesPorAndar !== null ? numero(ficha.unidadesPorAndar) : null],
        ["Vagas", ficha.totalVagas !== null ? numero(ficha.totalVagas) : null],
        ["Área do terreno", ficha.areaTerreno !== null ? `${numero(ficha.areaTerreno)} m²` : null],
        ["Área construída", ficha.areaConstruida !== null ? `${numero(ficha.areaConstruida)} m²` : null],
        ["Previsão de entrega", formatarPrevisaoEntrega(ficha.previsaoEntrega)],
      ].filter(([, valor]) => valor !== null && valor !== "") as Array<[string, string]>)
    : [];

  const tipologias = ficha?.tipologias ?? [];
  const chavesTipologia = new Set(tipologias.map((t) => t.key));
  const plantasImagem = condominio.plantas.filter((p) => p.imagemUrl);
  const gruposTipo: GrupoPlantas[] = tipologias
    .map((tipo) => ({
      key: tipo.key,
      titulo: tipo.nome,
      detalhes: detalhesTipologia(tipo),
      plantas: plantasImagem
        .filter((p) => p.tipologiaKey === tipo.key)
        .map((p) => ({ url: p.imagemUrl!, nome: p.nome })),
    }))
    .filter((grupo) => grupo.detalhes || grupo.plantas.length > 0);
  // Planta sem tipo (ou cujo tipo não existe mais) entra num grupo à parte.
  const semTipo = plantasImagem.filter((p) => !p.tipologiaKey || !chavesTipologia.has(p.tipologiaKey));
  const grupos: GrupoPlantas[] = [
    ...gruposTipo,
    ...(semTipo.length
      ? [{ key: "sem-tipo", titulo: gruposTipo.length ? "Outras plantas" : null, detalhes: null, plantas: semTipo.map((p) => ({ url: p.imagemUrl!, nome: p.nome })) }]
      : []),
  ];
  const plantasPdf = condominio.plantas.filter((p) => !p.imagemUrl && p.arquivoUrl);

  const localizacao = [condominio.bairro, [condominio.cidade, condominio.estado].filter(Boolean).join("/")].filter(Boolean).join(" — ");
  const enderecoCompleto = [condominio.endereco, condominio.complemento].filter(Boolean).join(" · ");

  const temAlgo =
    comCabecalho ||
    (comGaleria && condominio.fotos.length > 0) ||
    condominio.descricao ||
    condominio.comodidades.length > 0 ||
    fatos.length > 0 ||
    grupos.length > 0 ||
    plantasPdf.length > 0 ||
    condominio.bookUrl;
  if (!temAlgo) return null;

  return (
    <section aria-label="O condomínio" className="site-container py-10 md:py-14" id="condominio">
      {comCabecalho ? (
        <div className="mb-6 md:mb-8">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">O condomínio</p>
          <h2 className="mb-2 text-[22px] font-light tracking-[0.01em] md:text-[28px]">
            {condominio.href ? (
              <Link className="text-inherit no-underline hover:underline" href={condominio.href}>
                {condominio.nome}
              </Link>
            ) : (
              condominio.nome
            )}
          </h2>
          {enderecoCompleto || localizacao ? (
            <p className="text-[13px] text-navy">{[enderecoCompleto, localizacao].filter(Boolean).join(" — ")}</p>
          ) : null}
        </div>
      ) : null}

      {comGaleria && condominio.fotos.length > 0 ? (
        <div className="mb-8 md:mb-11">
          <h3 className={TITULO}>Fotos do condomínio</h3>
          <CondominioGallery images={condominio.fotos} nome={condominio.nome} />
        </div>
      ) : null}

      {condominio.descricao ? (
        <div className="mb-8 md:mb-11">
          <h3 className={TITULO}>Sobre o condomínio</h3>
          <p className="max-w-[680px] whitespace-pre-line text-sm leading-[1.85] text-[#4a4a48]">{condominio.descricao}</p>
        </div>
      ) : null}

      <ComodidadesLista catalogo={catalogo} slugs={condominio.comodidades} titulo="Comodidades do condomínio" />

      {fatos.length > 0 ? (
        <div className="mb-8 md:mb-11">
          <h3 className={TITULO}>Ficha técnica</h3>
          <dl className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
            {fatos.map(([rotulo, valor]) => (
              <div className="bg-white px-3 py-3.5 md:px-4 md:py-5" key={rotulo}>
                <dd className="mb-1 text-[14px] font-medium text-navy md:text-[16px]">{valor}</dd>
                <dt className="text-[9px] uppercase tracking-[0.05em] text-navy md:text-[10px]">{rotulo}</dt>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {grupos.length > 0 ? (
        <div className="mb-8 md:mb-11">
          <h3 className={TITULO}>{gruposTipo.length > 0 ? "Tipos de unidade e plantas" : "Plantas"}</h3>
          <TipologiasPlantas grupos={grupos} nome={condominio.nome} />
        </div>
      ) : null}

      {plantasPdf.length > 0 ? (
        <div className="mb-8 md:mb-11">
          <h3 className={TITULO}>Plantas para baixar</h3>
          <ul className="flex flex-col gap-2.5">
            {plantasPdf.map((planta) => (
              <li className="border-b border-navy/10 pb-2.5 text-[13px] text-navy" key={planta.key}>
                <a className="text-terra underline" href={planta.arquivoUrl!} rel="noopener" target="_blank">
                  Baixar planta — {planta.nome}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {condominio.bookUrl ? (
        <div>
          <a
            className="inline-block bg-terra px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white no-underline"
            href={condominio.bookUrl}
            rel="noopener"
            target="_blank"
          >
            Baixar book{condominio.bookNome ? ` — ${condominio.bookNome}` : ""}
          </a>
        </div>
      ) : null}
    </section>
  );
}
