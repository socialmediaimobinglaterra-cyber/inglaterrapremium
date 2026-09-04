import { XMLParser } from "fast-xml-parser";
import { Pool, PoolClient } from "pg";

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

  if (isAllCapsName(normalized)) {
    normalized = titleCaseName(normalized);
  }

  normalized = normalized.replace(/^Edificio\b/i, "Edifício");

  for (const [from, to] of CONDOMINIO_NAME_CORRECTIONS) {
    normalized = normalized.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi"), to);
  }

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
  return asArray((fotos.Foto as RawRecord | RawRecord[] | undefined) ?? []);
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
    bairroNome: text(raw.Bairro),
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

function shouldInclude(imovel: ParsedImovel, config: PremiumConfig) {
  const bairroAllowed = config.bairrosPermitidos
    .map(normalize)
    .includes(normalize(imovel.bairroNome ?? ""));

  if (!bairroAllowed) return false;
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
  const response = await fetch(xmlUrl);
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

async function upsertImovel(
  client: PoolClient,
  imovel: ParsedImovel,
  bairroId: string | null,
  seenAt: Date,
  premiumReason: string,
  elegivelFiltroAutomatico: boolean
) {
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
      ) values (
        'kenlo', $1, $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35,
        $36::jsonb, $37::jsonb, $38::jsonb, $39, $39, $40, true, $41,
        $42, now()
      )
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
    [
      imovel.kenloCodigo,
      imovel.codigoAuxiliar,
      imovel.slug,
      imovel.titulo,
      imovel.tipo,
      imovel.subtipo,
      imovel.finalidade,
      imovel.categoria,
      imovel.cidade,
      imovel.estado,
      bairroId,
      imovel.bairroNome,
      imovel.bairroOficial,
      imovel.endereco,
      imovel.numero,
      imovel.cep,
      imovel.latitude,
      imovel.longitude,
      imovel.nomeCondominio,
      imovel.nomeEdificio,
      imovel.statusComercial,
      imovel.tipoOferta,
      imovel.precoVenda,
      imovel.precoLocacao,
      imovel.precoCondominio,
      imovel.precoIptu,
      imovel.areaUtil,
      imovel.areaTotal,
      imovel.dormitorios,
      imovel.suites,
      imovel.banheiros,
      imovel.vagas,
      imovel.descricao,
      imovel.urlKenlo,
      imovel.videoUrl,
      JSON.stringify(imovel.corretor),
      JSON.stringify(imovel.fotos),
      JSON.stringify(imovel.raw),
      elegivelFiltroAutomatico,
      premiumReason,
      seenAt,
      imovel.kenloUpdatedAt,
    ]
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

  for (const [slug, condominio] of counts) {
    const bairroId = condominio.bairroNome
      ? bairroIds.get(normalize(condominio.bairroNome)) ?? null
      : null;
    await client.query(
      `
        insert into condominios (
          nome, slug, bairro_id, bairro_nome, imoveis_count, last_seen_at, updated_at
        ) values ($1, $2, $3, $4, $5, $6, now())
        on conflict (slug) do update set
          nome = excluded.nome,
          bairro_id = excluded.bairro_id,
          bairro_nome = excluded.bairro_nome,
          imoveis_count = excluded.imoveis_count,
          ativo = true,
          last_seen_at = excluded.last_seen_at,
          updated_at = now()
      `,
      [condominio.nome, slug, bairroId, condominio.bairroNome, condominio.count, seenAt]
    );
  }

  await client.query(
    "update condominios set ativo = false, updated_at = now() where last_seen_at is distinct from $1",
    [seenAt]
  );
}

export async function syncKenlo(pool: Pool, xmlUrl = DEFAULT_KENLO_XML_URL) {
  const client = await pool.connect();
  const seenAt = new Date();
  let logId: string | null = null;

  try {
    await client.query("begin");
    const log = await client.query(
      "insert into sincronizacoes_log (xml_url) values ($1) returning id",
      [xmlUrl]
    );
    logId = log.rows[0].id;
    await client.query("commit");

    const xml = await fetchXml(xmlUrl);
    const parsed = parseXml(xml);
    const condominiosNormalizados = getCondominioNormalizationReport(parsed);

    await client.query("begin");
    const config = await getPremiumConfig(client);
    const allowedNormalized = new Set(config.bairrosPermitidos.map(normalize));
    const byAllowedNeighborhood = parsed.filter((imovel) =>
      allowedNormalized.has(normalize(imovel.bairroNome ?? ""))
    );
    const filtered = byAllowedNeighborhood.filter((imovel) => shouldInclude(imovel, config));
    const automaticCodes = new Set(filtered.map((imovel) => imovel.kenloCodigo));

    const bairrosContagem: Record<string, number> = {};
    for (const bairro of config.bairrosPermitidos) bairrosContagem[bairro] = 0;
    for (const imovel of byAllowedNeighborhood) {
      const configuredName = config.bairrosPermitidos.find(
        (bairro) => normalize(bairro) === normalize(imovel.bairroNome ?? "")
      );
      if (configuredName) bairrosContagem[configuredName] += 1;
    }

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

    const bairroIds = new Map<string, string>();
    for (const bairro of config.bairrosPermitidos) {
      const id = await upsertBairro(client, bairro, bairrosContagem[bairro] ?? 0, seenAt);
      bairroIds.set(normalize(bairro), id);
    }

    for (const imovel of parsed) {
      const bairroId = imovel.bairroNome
        ? bairroIds.get(normalize(imovel.bairroNome)) ?? null
        : null;
      const elegivelFiltroAutomatico = automaticCodes.has(imovel.kenloCodigo);
      const premiumReason = config.valorMinimoPendente
        ? "Bairro permitido; valor mínimo pendente em configuracoes_premium."
        : "Bairro permitido e valor mínimo atendido.";
      const syncReason = elegivelFiltroAutomatico
        ? premiumReason
        : "Fora do filtro premium automatico; disponivel para curadoria manual.";
      await upsertImovel(
        client,
        imovel,
        bairroId,
        seenAt,
        syncReason,
        elegivelFiltroAutomatico
      );
    }

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

    await refreshCondominios(client, filtered, bairroIds, seenAt);

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
      sample: sample.rows,
    } satisfies SyncResult;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (logId) {
      await client.query(
        `
          update sincronizacoes_log
          set finished_at = now(), status = 'error', error_message = $2
          where id = $1
        `,
        [logId, error instanceof Error ? error.message : String(error)]
      );
    }
    throw error;
  } finally {
    client.release();
  }
}
