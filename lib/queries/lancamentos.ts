import { sanity } from "@/lib/sanity";
import type { NavDropdownItem } from "@/components/layout/HeaderClient";

export type LancamentoResumo = {
  id: string;
  nome: string;
  slug: string;
  bairro: string;
  cidade: string;
  estado: string;
  status: string | null;
  image: string | null;
  imagePosition: string;
};

export type LancamentoDetail = LancamentoResumo & {
  construtoraNome: string | null;
  construtoraLogo: { url: string; alt: string; principal: boolean; position: string } | null;
  entrega: string | null;
  faixa: string | null;
  metragens: string | null;
  unidades: string | null;
  descricao: string | null;
  descricao2: string | null;
  diferenciais: string[];
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  galeria: Array<{ url: string; alt: string; principal: boolean; position: string }>;
  capa: { url: string; alt: string; principal: boolean; position: string } | null;
};

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type SanityLancamentoRow = {
  _id: string;
  nome: string;
  slug: string;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  status: string | null;
  construtoraNome: string | null;
  construtoraLogoUrl: string | null;
  entrega: string | null;
  faixa: string | null;
  metragens: string | null;
  unidades: string | null;
  descricao: string | null;
  descricao2: string | null;
  diferenciais: string[] | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  capaUrl: string | null;
  galeriaUrls: (string | null)[] | null;
};

const LANCAMENTO_PROJECTION = `
  _id, nome, "slug": slug.current, bairro, cidade, estado, status,
  construtoraNome, "construtoraLogoUrl": construtoraLogo.asset->url,
  entrega, faixa, metragens, unidades, descricao, descricao2, diferenciais,
  endereco, latitude, longitude,
  "capaUrl": capa.asset->url, "galeriaUrls": galeria[].asset->url
`;

function mapLancamento(row: SanityLancamentoRow): LancamentoDetail {
  const nome = row.nome;
  const galeria = (row.galeriaUrls ?? [])
    .filter((url): url is string => Boolean(url))
    .map((url, index) => ({ url, alt: `${nome} - foto ${index + 1}`, principal: false, position: "center center" }));

  const capa = row.capaUrl
    ? { url: row.capaUrl, alt: nome, principal: true, position: "center center" }
    : null;

  const construtoraLogo = row.construtoraLogoUrl
    ? { url: row.construtoraLogoUrl, alt: row.construtoraNome ?? nome, principal: true, position: "center center" }
    : null;

  return {
    id: row._id,
    nome,
    slug: row.slug,
    bairro: row.bairro ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    estado: row.estado ?? "PR",
    status: row.status,
    construtoraNome: row.construtoraNome,
    construtoraLogo,
    entrega: row.entrega,
    faixa: row.faixa,
    metragens: row.metragens,
    unidades: row.unidades,
    descricao: row.descricao,
    descricao2: row.descricao2,
    diferenciais: row.diferenciais ?? [],
    endereco: row.endereco,
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    galeria,
    capa,
    image: capa?.url ?? galeria[0]?.url ?? null,
    imagePosition: capa?.position ?? galeria[0]?.position ?? "center center",
  };
}

export async function getHeaderLancamentos(): Promise<NavDropdownItem[]> {
  const rows = await sanity.fetch<Array<{ nome: string; slug: string }>>(
    `*[_type == "lancamento" && ativo == true && defined(slug.current)] { nome, "slug": slug.current } | order(nome asc)`
  );

  return rows.map((row) => ({
    label: row.nome,
    href: `/lancamentos/${row.slug}`,
  }));
}

export async function getLancamentoBySlug(slug: string) {
  const row = await sanity.fetch<SanityLancamentoRow | null>(
    `*[_type == "lancamento" && slug.current == $slug && ativo == true][0] { ${LANCAMENTO_PROJECTION} }`,
    { slug }
  );

  return row ? mapLancamento(row) : null;
}

export async function getRelatedLancamentos(currentSlug: string, limit = 3) {
  const rows = await sanity.fetch<SanityLancamentoRow[]>(
    `*[_type == "lancamento" && ativo == true && slug.current != $currentSlug] | order(nome asc) [0...$limit] { ${LANCAMENTO_PROJECTION} }`,
    { currentSlug, limit }
  );

  return rows.map(mapLancamento);
}
