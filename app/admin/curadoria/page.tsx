import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { getPool } from "@/lib/db";
import { logoutAction } from "../actions";
import { updateCuradoriaAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Curadoria Admin | Inglaterra Premium",
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    bairro?: string;
    tipo?: string;
    valor_min?: string;
    valor_max?: string;
    ok?: string;
    erro?: string;
  }>;
};

type CuradoriaRow = {
  id: string;
  kenlo_codigo: string;
  titulo: string;
  bairro_nome: string | null;
  tipo: string | null;
  preco_venda: string | null;
  preco_locacao: string | null;
  elegivel_filtro_automatico: boolean;
  inclusao_manual: boolean | null;
  ativo_no_site: boolean;
  ativo: boolean;
};

function currency(value: string | null) {
  if (!value) return "Sem valor";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function statusLabel(row: CuradoriaRow) {
  if (row.inclusao_manual === true) return "Incluido manualmente";
  if (row.inclusao_manual === false) return "Excluido manualmente";
  return row.elegivel_filtro_automatico
    ? "Dentro do filtro automatico"
    : "Fora do filtro automatico";
}

function statusClass(row: CuradoriaRow) {
  if (row.inclusao_manual === true) return "border-terra/20 bg-terra/10 text-terra";
  if (row.inclusao_manual === false) return "border-navy/15 bg-navy/5 text-sand";
  return row.elegivel_filtro_automatico
    ? "border-[#d98a4e]/25 bg-[#d98a4e]/10 text-terra"
    : "border-navy/10 bg-offwhite text-sand";
}

function normalizeMoney(value?: string) {
  if (!value) return null;
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

async function getCuradoriaData(params: Awaited<PageProps["searchParams"]>) {
  const pool = getPool();
  const [bairrosResult, tiposResult] = await Promise.all([
    pool.query(`
      select distinct bairro_nome
      from imoveis
      where origem = 'kenlo' and bairro_nome is not null
      order by bairro_nome
    `),
    pool.query(`
      select distinct tipo
      from imoveis
      where origem = 'kenlo' and tipo is not null
      order by tipo
    `),
  ]);

  const values: unknown[] = [];
  const where = ["origem = 'kenlo'"];

  if (params.q) {
    values.push(`%${params.q.trim()}%`);
    where.push(
      `(titulo ilike $${values.length} or kenlo_codigo ilike $${values.length} or bairro_nome ilike $${values.length})`
    );
  }

  if (params.bairro) {
    values.push(params.bairro);
    where.push(`bairro_nome = $${values.length}`);
  }

  if (params.tipo) {
    values.push(params.tipo);
    where.push(`tipo = $${values.length}`);
  }

  const min = normalizeMoney(params.valor_min);
  if (min !== null) {
    values.push(min);
    where.push(`coalesce(preco_venda, preco_locacao) >= $${values.length}`);
  }

  const max = normalizeMoney(params.valor_max);
  if (max !== null) {
    values.push(max);
    where.push(`coalesce(preco_venda, preco_locacao) <= $${values.length}`);
  }

  const result = await pool.query(
    `
      select id, kenlo_codigo, titulo, bairro_nome, tipo, preco_venda,
        preco_locacao, elegivel_filtro_automatico, inclusao_manual,
        ativo_no_site, ativo
      from imoveis
      where ${where.join(" and ")}
      order by ativo_no_site desc,
        elegivel_filtro_automatico desc,
        updated_at desc nulls last
      limit 80
    `,
    values
  );

  return {
    bairros: bairrosResult.rows.map((row) => row.bairro_nome as string),
    tipos: tiposResult.rows.map((row) => row.tipo as string),
    imoveis: result.rows as CuradoriaRow[],
  };
}

export default async function AdminCuradoriaPage({ searchParams }: PageProps) {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const data = await getCuradoriaData(params);

  return (
    <main className="site-container min-h-screen bg-offwhite py-24 text-navy">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <Link className="mb-4 inline-block text-xs text-sand hover:text-terra" href="/admin">
              Voltar ao painel
            </Link>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-terra">
              Admin
            </p>
            <h1 className="text-2xl font-light">Curadoria de imoveis</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand">
              Busque todos os imoveis sincronizados da Kenlo e defina se cada um
              segue o filtro automatico, entra manualmente ou fica excluido do site.
            </p>
          </div>
          <form action={logoutAction}>
            <button
              className="border border-navy/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-navy transition hover:border-terra hover:text-terra"
              type="submit"
            >
              Sair
            </button>
          </form>
        </div>

        {params.ok ? (
          <p className="mb-5 border border-navy/10 bg-white px-4 py-3 text-sm text-sand">
            Curadoria atualizada.
          </p>
        ) : null}

        <form className="mb-6 grid grid-cols-1 gap-3 border border-navy/10 bg-white p-4 md:grid-cols-[1.4fr_1fr_1fr_0.7fr_0.7fr_auto]">
          <input
            className="border border-navy/15 bg-offwhite px-3 py-2 text-sm outline-none focus:border-terra"
            defaultValue={params.q ?? ""}
            name="q"
            placeholder="Titulo, codigo ou bairro"
          />
          <select
            className="border border-navy/15 bg-offwhite px-3 py-2 text-sm outline-none focus:border-terra"
            defaultValue={params.bairro ?? ""}
            name="bairro"
          >
            <option value="">Todos os bairros</option>
            {data.bairros.map((bairro) => (
              <option key={bairro} value={bairro}>
                {bairro}
              </option>
            ))}
          </select>
          <select
            className="border border-navy/15 bg-offwhite px-3 py-2 text-sm outline-none focus:border-terra"
            defaultValue={params.tipo ?? ""}
            name="tipo"
          >
            <option value="">Todos os tipos</option>
            {data.tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
          <input
            className="border border-navy/15 bg-offwhite px-3 py-2 text-sm outline-none focus:border-terra"
            defaultValue={params.valor_min ?? ""}
            name="valor_min"
            placeholder="Valor min."
          />
          <input
            className="border border-navy/15 bg-offwhite px-3 py-2 text-sm outline-none focus:border-terra"
            defaultValue={params.valor_max ?? ""}
            name="valor_max"
            placeholder="Valor max."
          />
          <button
            className="bg-terra px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
            type="submit"
          >
            Buscar
          </button>
        </form>

        <div className="overflow-hidden border border-navy/10 bg-white">
          {data.imoveis.map((imovel) => (
            <div
              className="grid grid-cols-1 gap-4 border-b border-navy/10 p-4 last:border-b-0 lg:grid-cols-[1fr_220px]"
              key={imovel.id}
            >
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-sand">
                    {imovel.kenlo_codigo}
                  </span>
                  <span className={`border px-2 py-1 text-[10px] ${statusClass(imovel)}`}>
                    {statusLabel(imovel)}
                  </span>
                  <span className="border border-navy/10 px-2 py-1 text-[10px] text-sand">
                    {imovel.ativo_no_site && imovel.ativo ? "Aparece no site" : "Oculto no site"}
                  </span>
                </div>
                <h2 className="mb-2 text-sm font-medium leading-snug">{imovel.titulo}</h2>
                <p className="text-xs leading-relaxed text-sand">
                  {imovel.bairro_nome ?? "Sem bairro"} · {imovel.tipo ?? "Sem tipo"} · Venda:{" "}
                  {currency(imovel.preco_venda)} · Locacao: {currency(imovel.preco_locacao)}
                </p>
              </div>
              <form action={updateCuradoriaAction} className="grid grid-cols-3 gap-2 self-start">
                <input name="id" type="hidden" value={imovel.id} />
                <button
                  className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-navy hover:border-terra hover:text-terra"
                  name="override"
                  type="submit"
                  value="auto"
                >
                  Auto
                </button>
                <button
                  className="border border-terra bg-terra px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-white"
                  name="override"
                  type="submit"
                  value="include"
                >
                  Incluir
                </button>
                <button
                  className="border border-navy bg-navy px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-white"
                  name="override"
                  type="submit"
                  value="exclude"
                >
                  Excluir
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
