import { getPool } from "@/lib/db";
import type { ImovelSearchResult } from "@/lib/queries/imoveis";

type Foto = {
  URLArquivo?: string;
  Principal?: string | number;
};

export type BairroFaq = {
  question: string;
  answer: string;
};

export type BairroDetail = {
  id: string;
  nome: string;
  slug: string;
  cidade: string;
  estado: string;
  imagemCapa: string | null;
  descricao: string | null;
  faq: BairroFaq[];
  valorMedioVenda: number | null;
  imoveisDisponiveis: number;
  heroImage: string | null;
};

export type BairroSummary = {
  nome: string;
  slug: string;
  cidade: string;
  imoveisDisponiveis: number;
  image: string | null;
};

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getMainImage(fotos: Foto[] | null) {
  const all = Array.isArray(fotos) ? fotos : [];
  return (
    all.find((foto) => String(foto.Principal) === "1")?.URLArquivo ??
    all[0]?.URLArquivo ??
    "/images/capa-hero.jpg"
  );
}

function parseFaq(value: unknown): BairroFaq[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const question = record.question ?? record.pergunta;
      const answer = record.answer ?? record.resposta;

      if (typeof question !== "string" || typeof answer !== "string") return null;
      if (!question.trim() || !answer.trim()) return null;

      return { question: question.trim(), answer: answer.trim() };
    })
    .filter((item): item is BairroFaq => item !== null);
}

function mapImovel(row: Record<string, any>, index: number): ImovelSearchResult {
  return {
    id: String(index + 1).padStart(2, "0"),
    codigo: row.kenlo_codigo,
    slug: row.slug,
    titulo: row.titulo,
    bairro: row.bairro_nome ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    tipo: row.tipo ?? "Imovel",
    area: numberOrNull(row.area_util ?? row.area_total),
    suites: row.suites,
    dormitorios: row.dormitorios,
    vagas: row.vagas,
    precoVenda: numberOrNull(row.preco_venda),
    precoLocacao: numberOrNull(row.preco_locacao),
    image: getMainImage(row.fotos),
    tag: row.is_premium_override ? "EXCLUSIVO" : index === 0 ? "DESTAQUE" : "PREMIUM",
  };
}

export async function getBairroPageData(slug: string) {
  const pool = getPool();
  const bairroResult = await pool.query(
    `
      select id, nome, slug, cidade, estado, imagem_capa, descricao, faq
      from bairros
      where slug = $1 and ativo = true
      limit 1
    `,
    [slug]
  );

  const bairroRow = bairroResult.rows[0];
  if (!bairroRow) return null;

  const [metricsResult, imoveisResult, outrosResult] = await Promise.all([
    pool.query(
      `
        select
          avg(preco_venda)::numeric(14,2) as valor_medio_venda,
          count(*)::int as imoveis_disponiveis
        from imoveis
        where ativo = true
          and ativo_no_site = true
          and bairro_id = $1
      `,
      [bairroRow.id]
    ),
    pool.query(
      `
        select id, kenlo_codigo, slug, titulo, bairro_nome, cidade, tipo,
          area_util, area_total, suites, dormitorios, vagas, preco_venda,
          preco_locacao, fotos, is_premium_override
        from imoveis
        where ativo = true
          and ativo_no_site = true
          and bairro_id = $1
        order by coalesce(preco_venda, preco_locacao) desc nulls last
        limit 6
      `,
      [bairroRow.id]
    ),
    pool.query(
      `
        select
          b.nome,
          b.slug,
          b.cidade,
          b.imagem_capa,
          count(i.id)::int as imoveis_disponiveis
        from bairros b
        left join imoveis i on i.ativo = true
          and i.ativo_no_site = true
          and i.bairro_id = b.id
        where b.ativo = true and b.slug <> $1
        group by b.id, b.nome, b.slug, b.cidade, b.imagem_capa
        order by imoveis_disponiveis desc, b.nome
        limit 3
      `,
      [slug]
    ),
  ]);

  const metrics = metricsResult.rows[0] ?? {};
  const bairro: BairroDetail = {
    id: bairroRow.id,
    nome: bairroRow.nome,
    slug: bairroRow.slug,
    cidade: bairroRow.cidade,
    estado: bairroRow.estado,
    imagemCapa:
      typeof bairroRow.imagem_capa === "string" && bairroRow.imagem_capa.trim()
        ? bairroRow.imagem_capa.trim()
        : null,
    descricao: bairroRow.descricao,
    faq: parseFaq(bairroRow.faq),
    valorMedioVenda: numberOrNull(metrics.valor_medio_venda),
    imoveisDisponiveis: metrics.imoveis_disponiveis ?? 0,
    heroImage:
      typeof bairroRow.imagem_capa === "string" && bairroRow.imagem_capa.trim()
        ? bairroRow.imagem_capa.trim()
        : null,
  };

  const imoveis = imoveisResult.rows.map(mapImovel);
  const outrosBairros: BairroSummary[] = outrosResult.rows.map((row) => ({
    nome: row.nome,
    slug: row.slug,
    cidade: row.cidade,
    imoveisDisponiveis: row.imoveis_disponiveis,
    image:
      typeof row.imagem_capa === "string" && row.imagem_capa.trim()
        ? row.imagem_capa.trim()
        : null,
  }));

  return { bairro, imoveis, outrosBairros };
}
