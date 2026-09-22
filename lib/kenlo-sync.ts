import { XMLParser } from "fast-xml-parser";
import { Pool, PoolClient } from "pg";
import { normalizeImageUrl } from "./images";

export const DEFAULT_KENLO_XML_URL =
  "https://imob.valuegaia.com.br/integra/midia.ashx?midia=AgendaCafeImovel&p=79jA%2fz7y9yJfyVhhZtMoUfPChbC91raf";

type RawRecord = Record<string, unknown>;

type PremiumConfig = {
  bairrosPermitidos: string[];
  valorMinimoVenda: number | null;
  valorMinimoLocacao: number | null;
  valorMinimoPendente: boolean;
};

type ParsedImovel = {
  kenloCodigo: string;
  codigoAuxiliar: string | null;
  slug: string;
  titulo: string;
  tipo: string | null;
  subtipo: string | null;
  finalidade: string | null;
  categoria: string | null;
  cidade: string | null;
  estado: string | null;
  bairroNome: string | null;
  bairroOficial: string | null;
  endereco: string | null;
  numero: string | null;
  cep: string | null;
  latitude: number | null;
  longitude: number | null;
  nomeCondominioOriginal: string | null;
  nomeCondominio: string | null;
  nomeEdificio: string | null;
  statusComercial: string | null;
  tipoOferta: string | null;
  precoVenda: number | null;
  precoLocacao: number | null;
  precoCondominio: number | null;
  precoIptu: number | null;
  areaUtil: number | null;
  areaTotal: number | null;
  dormitorios: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  descricao: string | null;
  urlKenlo: string | null;
  videoUrl: string | null;
  corretor: RawRecord;
  fotos: RawRecord[];
  raw: RawRecord;
  kenloUpdatedAt: Date | null;
};

type SyncResult = {
  logId: string;
  totalXml: number;
  totalBairrosPermitidos: number;
  totalPremium: number;
  imoveisEntraram: number;
  imoveisSairam: number;
  valorMinimoPendente: boolean;
  bairrosContagem: Record<string, number>;
  condominiosNormalizados: {
    totalOcorrencias: number;
    nomes: Array<{
      de: string;
      para: string;
      ocorrencias: number;
    }>;
  };
  condominiosExistentesNormalizados: Array<{
    de: string;
    para: string;
  }>;
  imoveisExistentesNormalizados: Array<{
    de: string;
    para: string;
    ocorrencias: number;
  }>;
  sample: Array<{
    codigo: string;
    titulo: string;
    bairro: string | null;
    preco_venda: string | null;
    preco_locacao: string | null;
  }>;
};

function text(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

const CONDOMINIO_NAME_CORRECTIONS = [
  ["Plange", "Plaenge"],
  ["RESIDENC IAL ATHENAS", "Residencial Athenas"],
  ["Porto das Aguas", "Porto das Águas"],
  ["Estancia Cabral", "Estância Cabral"],
  ["Condominio Caiuã", "Condomínio Caiuã"],
] as const;

const LOWERCASE_TITLE_WORDS = new Set(["de", "do", "da", "dos", "das", "e"]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAllCapsName(value: string) {
  return value !== value.toLocaleLowerCase("pt-BR") && value === value.toLocaleUpperCase("pt-BR");
}

function titleCaseName(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/\p{L}[\p{L}\p{M}]*/gu, (word) =>
      LOWERCASE_TITLE_WORDS.has(word)
        ? word
        : `${word.charAt(0).toLocaleUpperCase("pt-BR")}${word.slice(1)}`
    );
}

function normalizeCondominioName(value: string | null) {
  if (!value) return null;

  let normalized = value.trim().replace(/\s+/g, " ");

  for (const [from, to] of CONDOMINIO_NAME_CORRECTIONS) {
    normalized = normalized.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi"), to);
  }

  if (isAllCapsName(normalized)) {
    normalized = titleCaseName(normalized);
  }

  normalized = normalized
    .replace(/\bEdificio\b/gi, "Edifício")
    .replace(/\bCondominio\b/gi, "Condomínio");

  return normalized;
}

function getCondominioNormalizationReport(imoveis: ParsedImovel[]) {
  const changes = new Map<string, { de: string; para: string; ocorrencias: number }>();

  for (const imovel of imoveis) {
    if (!imovel.nomeCondominioOriginal || !imovel.nomeCondominio) continue;
    if (imovel.nomeCondominioOriginal === imovel.nomeCondominio) continue;

    const key = `${imovel.nomeCondominioOriginal}\n${imovel.nomeCondominio}`;
    const current = changes.get(key);
    changes.set(key, {
      de: imovel.nomeCondominioOriginal,
      para: imovel.nomeCondominio,
      ocorrencias: (current?.ocorrencias ?? 0) + 1,
    });
  }

  const nomes = [...changes.values()].sort((a, b) => a.de.localeCompare(b.de, "pt-BR"));

  return {
    totalOcorrencias: nomes.reduce((total, item) => total + item.ocorrencias, 0),
    nomes,
  };
}

function numberValue(value: unknown): number | null {
  const normalized = text(value);
  if (!normalized) return null;
  const decimal =
    normalized.includes(",") && normalized.includes(".")
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(",", ".");
  const parsed = Number(decimal);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerValue(value: unknown): number | null {
  const parsed = numberValue(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseBrazilianDate(value: unknown): Date | null {
  const normalized = text(value);
  if (!normalized) return null;

  const match = normalized.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/
  );
  if (!match) return null;

  const [, day, month, year, hour = "00", minute = "00", second = "00"] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`);
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getFotos(raw: RawRecord): RawRecord[] {
  const fotos = raw.Fotos as RawRecord | undefined;
  if (!fotos) return [];
  return asArray((fotos.Foto as RawRecord | RawRecord[] | undefined) ?? []).map((foto) => ({
    ...foto,
    URLArquivo: normalizeImageUrl(text(foto.URLArquivo)) ?? foto.URLArquivo,
  }));
}

function parseImovel(raw: RawRecord): ParsedImovel | null {
  const codigo = text(raw.CodigoImovel);
  const titulo = text(raw.TituloImovel) ?? codigo;

  if (!codigo || !titulo) return null;

  const corretor = (raw.corretor as RawRecord | undefined) ?? {};
  const nomeCondominioOriginal = text(raw.NomeCondominio);

  return {
    kenloCodigo: codigo,
    codigoAuxiliar: text(raw.CodigoImovelAuxiliar),
    slug: `${slugify(titulo)}-${slugify(codigo)}`,
    titulo,
    tipo: text(raw.TipoImovel),
    subtipo: text(raw.SubTipoImovel),
    finalidade: text(raw.Finalidade),
    categoria: text(raw.CategoriaImovel),
    cidade: text(raw.Cidade),
    estado: text(raw.Estado),
    bairroNome: text(raw.BairroOficial) ?? text(raw.Bairro),
    bairroOficial: text(raw.BairroOficial),
    endereco: text(raw.Endereco),
    numero: text(raw.Numero),
    cep: text(raw.CEP),
    latitude: numberValue(raw.latitude),
    longitude: numberValue(raw.longitude),
    nomeCondominioOriginal,
    nomeCondominio: normalizeCondominioName(nomeCondominioOriginal),
    nomeEdificio: text(raw.NomeEdificio),
    statusComercial: text(raw.StatusComercial),
    tipoOferta: text(raw.TipoOferta),
    precoVenda: numberValue(raw.PrecoVenda),
    precoLocacao: numberValue(raw.PrecoLocacao),
    precoCondominio: numberValue(raw.PrecoCondominio),
    precoIptu: numberValue(raw.PrecoIptu),
    areaUtil: numberValue(raw.AreaUtil),
    areaTotal: numberValue(raw.AreaTotal),
    dormitorios: integerValue(raw.QtdDormitorios),
    suites: integerValue(raw.QtdSuites),
    banheiros: integerValue(raw.QtdBanheiros),
    vagas: integerValue(raw.QtdVagas),
    descricao: text(raw.Observacao),
    urlKenlo: text(raw.URLGaiaSite),
    videoUrl: text(raw.LinkVideo),
    corretor,
    fotos: getFotos(raw),
    raw,
    kenloUpdatedAt: parseBrazilianDate(raw.DataAtualizacaoImovel),
  };
}

function shouldInclude(
  imovel: ParsedImovel,
  config: PremiumConfig,
  premiumCondominios: Set<string>
) {
  const bairroAllowed = config.bairrosPermitidos
    .map(normalize)
    .includes(normalize(imovel.bairroNome ?? ""));
  const condominioPremium = imovel.nomeCondominio
    ? premiumCondominios.has(normalize(imovel.nomeCondominio))
    : false;

  if (!bairroAllowed && !condominioPremium) return false;
  if (config.valorMinimoPendente) return true;

  const vendaOk =
    config.valorMinimoVenda !== null &&
    imovel.precoVenda !== null &&
    imovel.precoVenda >= config.valorMinimoVenda;
  const locacaoOk =
    config.valorMinimoLocacao !== null &&
    imovel.precoLocacao !== null &&
    imovel.precoLocacao >= config.valorMinimoLocacao;

  return vendaOk || locacaoOk;
}

async function getPremiumCondominios(client: PoolClient) {
  const { rows } = await client.query<{ nome: string }>(
    "select nome from condominios where premium = true and ativo = true"
  );
  return new Set(rows.map((row) => normalize(row.nome)));
}

function getPremiumReason(
  imovel: ParsedImovel,
  config: PremiumConfig,
  premiumCondominios: Set<string>
) {
  const bairroAllowed = config.bairrosPermitidos
    .map(normalize)
    .includes(normalize(imovel.bairroNome ?? ""));
  const condominioPremium = imovel.nomeCondominio
    ? premiumCondominios.has(normalize(imovel.nomeCondominio))
    : false;
  const criterioLocalizacao =
    bairroAllowed && condominioPremium
      ? "bairro permitido e condominio premium"
      : condominioPremium
        ? "condominio premium"
        : "bairro permitido";

  return config.valorMinimoPendente
    ? `${criterioLocalizacao}; valor minimo pendente em configuracoes_premium.`
    : `${criterioLocalizacao} e valor minimo atendido.`;
}

async function getPremiumConfig(client: PoolClient): Promise<PremiumConfig> {
  const { rows } = await client.query(
    `
      select bairros_permitidos, valor_minimo_venda, valor_minimo_locacao, valor_minimo_pendente
      from configuracoes_premium
      where chave = 'criterios_premium'
      limit 1
    `
  );

  if (rows.length === 0) {
    throw new Error("Configuração 'criterios_premium' não encontrada.");
  }

  const row = rows[0];
  return {
    bairrosPermitidos: row.bairros_permitidos,
    valorMinimoVenda:
      row.valor_minimo_venda === null ? null : Number(row.valor_minimo_venda),
    valorMinimoLocacao:
      row.valor_minimo_locacao === null ? null : Number(row.valor_minimo_locacao),
    valorMinimoPendente: row.valor_minimo_pendente,
  };
}

async function fetchXml(xmlUrl: string) {
  const response = await fetch(xmlUrl, { signal: AbortSignal.timeout(60_000), cache: "no-store" });
  if (!response.ok) throw new Error(`Kenlo respondeu HTTP ${response.status}.`);
  return response.text();
}

function parseXml(xml: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
  });

  const parsed = parser.parse(xml) as {
    Carga?: { Imoveis?: { Imovel?: RawRecord | RawRecord[] } };
  };

  return asArray(parsed.Carga?.Imoveis?.Imovel)
    .map(parseImovel)
    .filter((imovel): imovel is ParsedImovel => imovel !== null);
}

async function upsertBairro(client: PoolClient, nome: string, count: number, seenAt: Date) {
  const slug = slugify(nome);
  const { rows } = await client.query(
    `
      insert into bairros (nome, slug, imoveis_xml_bruto, last_seen_at, updated_at)
      values ($1, $2, $3, $4, now())
      on conflict (slug) do update set
        nome = excluded.nome,
        imoveis_xml_bruto = excluded.imoveis_xml_bruto,
        ativo = true,
        last_seen_at = excluded.last_seen_at,
        updated_at = now()
      returning id
    `,
    [nome, slug, count, seenAt]
  );
  return rows[0].id as string;
}

function imovelValues(
  imovel: ParsedImovel,
  bairroId: string | null,
  seenAt: Date,
  premiumReason: string,
  elegivelFiltroAutomatico: boolean
) {
  return [
    imovel.kenloCodigo, imovel.codigoAuxiliar, imovel.slug, imovel.titulo,
    imovel.tipo, imovel.subtipo, imovel.finalidade, imovel.categoria,
    imovel.cidade, imovel.estado, bairroId, imovel.bairroNome,
    imovel.bairroOficial, imovel.endereco, imovel.numero, imovel.cep,
    imovel.latitude, imovel.longitude, imovel.nomeCondominio, imovel.nomeEdificio,
    imovel.statusComercial, imovel.tipoOferta, imovel.precoVenda, imovel.precoLocacao,
    imovel.precoCondominio, imovel.precoIptu, imovel.areaUtil, imovel.areaTotal,
    imovel.dormitorios, imovel.suites, imovel.banheiros, imovel.vagas,
    imovel.descricao, imovel.urlKenlo, imovel.videoUrl,
    JSON.stringify(imovel.corretor), JSON.stringify(imovel.fotos), JSON.stringify(imovel.raw),
    elegivelFiltroAutomatico, premiumReason, seenAt, imovel.kenloUpdatedAt,
  ];
}

async function upsertImoveis(client: PoolClient, rows: ReturnType<typeof imovelValues>[]) {
  if (!rows.length) return;
  const placeholders = rows.map((row, index) => {
    const p = row.map((_, column) => `$${index * 42 + column + 1}`);
    return `('kenlo', ${p[0]}, ${p.slice(0, 35).join(", ")},
      ${p[35]}::jsonb, ${p[36]}::jsonb, ${p[37]}::jsonb,
      ${p[38]}, ${p[38]}, ${p[39]}, true, ${p[40]}, ${p[41]}, now())`;
  });
  await client.query(
    `
      insert into imoveis (
        origem, kenlo_id, kenlo_codigo, codigo_auxiliar, slug, titulo, tipo, subtipo, finalidade,
        categoria, cidade, estado, bairro_id, bairro_nome, bairro_oficial,
        endereco, numero, cep, latitude, longitude, nome_condominio,
        nome_edificio, status_comercial, tipo_oferta, preco_venda,
        preco_locacao, preco_condominio, preco_iptu, area_util, area_total,
        dormitorios, suites, banheiros, vagas, descricao, url_kenlo, video_url,
        corretor, fotos, raw, elegivel_filtro_automatico, is_premium,
        premium_reason, ativo, last_seen_at,
        kenlo_updated_at, updated_at
      ) values ${placeholders.join(", ")}
      on conflict (kenlo_codigo) do update set
        origem = 'kenlo',
        kenlo_id = excluded.kenlo_id,
        codigo_auxiliar = excluded.codigo_auxiliar,
        slug = excluded.slug,
        titulo = excluded.titulo,
        tipo = excluded.tipo,
        subtipo = excluded.subtipo,
        finalidade = excluded.finalidade,
        categoria = excluded.categoria,
        cidade = excluded.cidade,
        estado = excluded.estado,
        bairro_id = excluded.bairro_id,
        bairro_nome = excluded.bairro_nome,
        bairro_oficial = excluded.bairro_oficial,
        endereco = excluded.endereco,
        numero = excluded.numero,
        cep = excluded.cep,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        nome_condominio = excluded.nome_condominio,
        nome_edificio = excluded.nome_edificio,
        status_comercial = excluded.status_comercial,
        tipo_oferta = excluded.tipo_oferta,
        preco_venda = excluded.preco_venda,
        preco_locacao = excluded.preco_locacao,
        preco_condominio = excluded.preco_condominio,
        preco_iptu = excluded.preco_iptu,
        area_util = excluded.area_util,
        area_total = excluded.area_total,
        dormitorios = excluded.dormitorios,
        suites = excluded.suites,
        banheiros = excluded.banheiros,
        vagas = excluded.vagas,
        descricao = excluded.descricao,
        url_kenlo = excluded.url_kenlo,
        video_url = excluded.video_url,
        corretor = excluded.corretor,
        fotos = excluded.fotos,
        raw = excluded.raw,
        elegivel_filtro_automatico = excluded.elegivel_filtro_automatico,
        is_premium = excluded.is_premium,
        premium_reason = excluded.premium_reason,
        ativo = true,
        last_seen_at = excluded.last_seen_at,
        kenlo_updated_at = excluded.kenlo_updated_at,
        updated_at = now()
      where imoveis.origem = 'kenlo'
    `,
    rows.flat()
  );
}

async function refreshCondominios(
  client: PoolClient,
  imoveis: ParsedImovel[],
  bairroIds: Map<string, string>,
  seenAt: Date
) {
  const counts = new Map<string, { nome: string; bairroNome: string | null; count: number }>();

  for (const imovel of imoveis) {
    if (!imovel.nomeCondominio) continue;
    const slug = slugify(imovel.nomeCondominio);
    const current = counts.get(slug);
    counts.set(slug, {
      nome: imovel.nomeCondominio,
      bairroNome: current?.bairroNome ?? imovel.bairroNome,
      count: (current?.count ?? 0) + 1,
    });
  }

  const entries = [...counts];
  for (let offset = 0; offset < entries.length; offset += 100) {
    const values = entries.slice(offset, offset + 100).flatMap(([slug, condominio]) => {
      const bairroId = condominio.bairroNome
        ? bairroIds.get(normalize(condominio.bairroNome)) ?? null
        : null;
      return [condominio.nome, slug, bairroId, condominio.bairroNome, condominio.count, seenAt];
    });
    const placeholders = Array.from({ length: values.length / 6 }, (_, index) =>
      `(${Array.from({ length: 6 }, (_, column) => `$${index * 6 + column + 1}`).join(", ")}, now())`
    );
    await client.query(
      `
        insert into condominios (
          nome, slug, bairro_id, bairro_nome, imoveis_count, last_seen_at, updated_at
        ) values ${placeholders.join(", ")}
        on conflict (slug) do update set
          nome = excluded.nome,
          bairro_id = excluded.bairro_id,
          bairro_nome = excluded.bairro_nome,
          imoveis_count = excluded.imoveis_count,
          ativo = true,
          last_seen_at = excluded.last_seen_at,
          updated_at = now()
      `,
      values
    );
  }

  await client.query(
    "update condominios set ativo = false, updated_at = now() where last_seen_at is distinct from $1",
    [seenAt]
  );
}

async function normalizeExistingCondominios(client: PoolClient) {
  const { rows } = await client.query<{ id: string; nome: string }>(
    "select id, nome from condominios"
  );
  const changed: Array<{ de: string; para: string }> = [];
  const updates: Array<{ id: string; nome: string }> = [];

  for (const row of rows) {
    const normalized = normalizeCondominioName(row.nome);
    if (!normalized || normalized === row.nome) continue;

    updates.push({ id: row.id, nome: normalized });
    changed.push({ de: row.nome, para: normalized });
  }

  if (updates.length) {
    await client.query(`update condominios c set nome = u.nome, updated_at = now()
      from jsonb_to_recordset($1::jsonb) as u(id uuid, nome text) where c.id = u.id`,
      [JSON.stringify(updates)]);
  }
  return changed.sort((a, b) => a.de.localeCompare(b.de, "pt-BR"));
}

async function normalizeExistingKenloImoveis(client: PoolClient) {
  const { rows } = await client.query<{ id: string; nome_condominio: string }>(
    `
      select id, nome_condominio
      from imoveis
      where origem = 'kenlo'
        and nome_condominio is not null
    `
  );
  const changed = new Map<string, { de: string; para: string; ocorrencias: number }>();
  const updates: Array<{ id: string; nome: string }> = [];

  for (const row of rows) {
    const normalized = normalizeCondominioName(row.nome_condominio);
    if (!normalized || normalized === row.nome_condominio) continue;

    updates.push({ id: row.id, nome: normalized });

    const key = `${row.nome_condominio}\n${normalized}`;
    const current = changed.get(key);
    changed.set(key, {
      de: row.nome_condominio,
      para: normalized,
      ocorrencias: (current?.ocorrencias ?? 0) + 1,
    });
  }

  if (updates.length) {
    await client.query(`update imoveis i set nome_condominio = u.nome, updated_at = now()
      from jsonb_to_recordset($1::jsonb) as u(id uuid, nome text)
      where i.id = u.id and i.origem = 'kenlo'`, [JSON.stringify(updates)]);
  }
  return [...changed.values()].sort((a, b) => a.de.localeCompare(b.de, "pt-BR"));
}

export async function syncKenlo(pool: Pool, xmlUrl = DEFAULT_KENLO_XML_URL) {
  const client = await pool.connect();
  const seenAt = new Date();
  let logId: string | null = null;
  const started = Date.now();
  const timings: Record<string, number> = {};
  let stage = "download";
  let stageStarted = started;
  function nextStage(next: string) {
    timings[stage] = Date.now() - stageStarted;
    console.info("[xml-sync]", { logId, stage, durationMs: timings[stage] });
    stage = next;
    stageStarted = Date.now();
  }

  try {
    await client.query("begin");
    const log = await client.query(
      "insert into sincronizacoes_log (xml_url) values ($1) returning id",
      [xmlUrl]
    );
    logId = log.rows[0].id;
    await client.query("commit");

    const xml = await fetchXml(xmlUrl);
    nextStage("parse");
    const parsed = parseXml(xml);
    if (!parsed.length) throw new Error("XML sem imoveis validos; catalogo preservado.");
    const condominiosNormalizados = getCondominioNormalizationReport(parsed);
    nextStage("catalogos");

    await client.query("begin");
    await client.query("set local statement_timeout = '30s'");
    await client.query("set local lock_timeout = '5s'");
    await client.query("set local idle_in_transaction_session_timeout = '60s'");
    const lock = await client.query<{ acquired: boolean }>(
      "select pg_try_advisory_xact_lock(79260322) as acquired"
    );
    if (!lock.rows[0].acquired) throw new Error("Outra sincronizacao XML esta em andamento.");
    const config = await getPremiumConfig(client);
    const allowedNormalized = new Set(config.bairrosPermitidos.map(normalize));
    const byAllowedNeighborhood = parsed.filter((imovel) =>
      allowedNormalized.has(normalize(imovel.bairroNome ?? ""))
    );

    const bairrosContagem: Record<string, number> = {};
    for (const bairro of config.bairrosPermitidos) bairrosContagem[bairro] = 0;
    for (const imovel of byAllowedNeighborhood) {
      const configuredName = config.bairrosPermitidos.find(
        (bairro) => normalize(bairro) === normalize(imovel.bairroNome ?? "")
      );
      if (configuredName) bairrosContagem[configuredName] += 1;
    }

    const bairroIds = new Map<string, string>();
    for (const bairro of config.bairrosPermitidos) {
      const id = await upsertBairro(client, bairro, bairrosContagem[bairro] ?? 0, seenAt);
      bairroIds.set(normalize(bairro), id);
    }

    await refreshCondominios(client, parsed, bairroIds, seenAt);
    const premiumCondominios = await getPremiumCondominios(client);
    const filtered = parsed.filter((imovel) => shouldInclude(imovel, config, premiumCondominios));
    const automaticCodes = new Set(filtered.map((imovel) => imovel.kenloCodigo));

    const before = await client.query(
      "select kenlo_codigo from imoveis where origem = 'kenlo' and ativo = true and elegivel_filtro_automatico = true"
    );
    const previousCodes = new Set<string>(before.rows.map((row) => row.kenlo_codigo));
    const currentCodes = automaticCodes;

    const imoveisEntraram = [...currentCodes].filter(
      (codigo) => !previousCodes.has(codigo)
    ).length;
    const imoveisSairam = [...previousCodes].filter(
      (codigo) => !currentCodes.has(codigo)
    ).length;

    nextStage("imoveis");
    // Preserve the previous last-occurrence-wins behavior for repeated source codes.
    const uniqueImoveis = [...new Map(parsed.map((imovel) => [imovel.kenloCodigo, imovel])).values()];
    for (let offset = 0; offset < uniqueImoveis.length; offset += 100) {
      if (Date.now() - started > 240_000) {
        throw new Error("Sincronizacao excedeu o prazo seguro; alteracoes revertidas.");
      }
      const rows = uniqueImoveis.slice(offset, offset + 100).map((imovel) => {
        const bairroId = imovel.bairroNome
          ? bairroIds.get(normalize(imovel.bairroNome)) ?? null
          : null;
        const elegivelFiltroAutomatico = automaticCodes.has(imovel.kenloCodigo);
        const premiumReason = getPremiumReason(imovel, config, premiumCondominios);
        const syncReason = elegivelFiltroAutomatico
          ? premiumReason
          : "Fora do filtro premium automatico; disponivel para curadoria manual.";
        return imovelValues(imovel, bairroId, seenAt, syncReason, elegivelFiltroAutomatico);
      });
      await upsertImoveis(client, rows);
      console.info("[xml-sync]", { logId, stage, processed: Math.min(offset + 100, uniqueImoveis.length), total: uniqueImoveis.length });
    }
    nextStage("finalizacao");

    await client.query(
      `
        update imoveis
        set ativo = false,
          elegivel_filtro_automatico = false,
          is_premium = false,
          updated_at = now()
        where origem = 'kenlo'
          and ativo = true
          and not (kenlo_codigo = any($1::text[]))
      `,
      [parsed.map((imovel) => imovel.kenloCodigo)]
    );

    const condominiosExistentesNormalizados = await normalizeExistingCondominios(client);
    const imoveisExistentesNormalizados = await normalizeExistingKenloImoveis(client);
    nextStage("conclusao");

    await client.query(
      `
        update sincronizacoes_log
        set
          finished_at = now(),
          status = 'success',
          total_xml = $2,
          total_bairros_permitidos = $3,
          total_premium = $4,
          imoveis_entraram = $5,
          imoveis_sairam = $6,
          valor_minimo_pendente = $7,
          bairros_contagem = $8::jsonb,
          metadata = $9::jsonb
        where id = $1
      `,
      [
        logId,
        parsed.length,
        byAllowedNeighborhood.length,
        filtered.length,
        imoveisEntraram,
        imoveisSairam,
        config.valorMinimoPendente,
        JSON.stringify(bairrosContagem),
        JSON.stringify({
          valor_minimo_venda: config.valorMinimoVenda,
          valor_minimo_locacao: config.valorMinimoLocacao,
          timings_ms: timings,
        }),
      ]
    );

    const sample = await client.query(
      `
        select
          kenlo_codigo as codigo,
          titulo,
          bairro_nome as bairro,
          preco_venda,
          preco_locacao
        from imoveis
        where origem = 'kenlo' and ativo = true and ativo_no_site = true
        order by bairro_nome, preco_venda desc nulls last
        limit 5
      `
    );

    await client.query("commit");
    nextStage("success");
    console.info("[xml-sync]", { logId, stage, totalMs: Date.now() - started });

    if (!logId) {
      throw new Error("Log de sincronização não foi criado.");
    }

    return {
      logId,
      totalXml: parsed.length,
      totalBairrosPermitidos: byAllowedNeighborhood.length,
      totalPremium: filtered.length,
      imoveisEntraram,
      imoveisSairam,
      valorMinimoPendente: config.valorMinimoPendente,
      bairrosContagem,
      condominiosNormalizados,
      condominiosExistentesNormalizados,
      imoveisExistentesNormalizados,
      sample: sample.rows,
    } satisfies SyncResult;
  } catch (error) {
    console.error("[xml-sync]", { logId, stage, totalMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) });
    await client.query("rollback").catch(() => undefined);
    if (logId) {
      await client.query(
        `
          update sincronizacoes_log
          set finished_at = now(), status = 'error', error_message = $2, metadata = $3::jsonb
          where id = $1
        `,
        [logId, error instanceof Error ? error.message : String(error), JSON.stringify({ stage, timings_ms: timings, total_ms: Date.now() - started })]
      );
    }
    throw error;
  } finally {
    client.release();
  }
}
