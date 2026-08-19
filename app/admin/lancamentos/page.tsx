import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LancamentoForm } from "@/components/admin/LancamentoForm";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { getPool } from "@/lib/db";
import { logoutAction } from "../actions";
import { deleteLancamentoAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lançamentos Admin | Inglaterra Premium",
};

type PageProps = {
  searchParams: Promise<{
    editar?: string;
    ok?: string;
    erro?: string;
  }>;
};

type LancamentoAdmin = {
  id: string;
  kenloCodigo: string | null;
  nome: string;
  slug: string;
  bairroNome: string | null;
  cidade: string;
  estado: string;
  imovelId: string | null;
  ativo: boolean;
  status: string | null;
  construtoraNome: string | null;
  construtoraLogo: { url: string; alt?: string; position?: string } | null;
  entrega: string | null;
  faixa: string | null;
  metragens: string | null;
  unidades: string | null;
  endereco: string | null;
  latitude: string | null;
  longitude: string | null;
  descricao: string | null;
  descricao2: string | null;
  diferenciais: string[];
  capa: { url: string; alt?: string; position?: string } | null;
  galeria: Array<{ url: string; alt?: string; position?: string }>;
  updatedAt: Date;
};

function rawString(raw: Record<string, unknown>, key: string) {
  const value = raw[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function rawArray(raw: Record<string, unknown>, key: string) {
  const value = raw[key];
  if (!Array.isArray(value)) return [];
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function rawGallery(raw: Record<string, unknown>) {
  const value = raw.galeria;
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        url: typeof record.url === "string" ? record.url : "",
        alt: typeof record.alt === "string" ? record.alt : "",
        position: typeof record.position === "string" ? record.position : "center center",
      };
    })
    .filter((item): item is { url: string; alt: string; position: string } => Boolean(item?.url));
}

function rawCover(raw: Record<string, unknown>) {
  const coverValue = raw.capa;
  const [cover] = rawGallery({
    galeria: Array.isArray(coverValue) ? coverValue : coverValue ? [coverValue] : [],
  });
  return cover ?? null;
}

function mapLancamento(row: Record<string, any>): LancamentoAdmin {
  const raw = (row.raw && typeof row.raw === "object" ? row.raw : {}) as Record<string, unknown>;

  return {
    id: row.id,
    kenloCodigo: row.kenlo_codigo,
    nome: row.nome,
    slug: row.slug,
    bairroNome: row.bairro_nome,
    cidade: row.cidade ?? "Londrina",
    estado: row.estado ?? "PR",
    imovelId: row.imovel_id,
    ativo: row.ativo,
    status: rawString(raw, "status"),
    construtoraNome: rawString(raw, "construtoraNome"),
    construtoraLogo: rawCover({ capa: raw.construtoraLogo }),
    entrega: rawString(raw, "entrega"),
    faixa: rawString(raw, "faixa"),
    metragens: rawString(raw, "metragens"),
    unidades: rawString(raw, "unidades"),
    endereco: rawString(raw, "endereco"),
    latitude: rawString(raw, "latitude"),
    longitude: rawString(raw, "longitude"),
    descricao: rawString(raw, "descricao"),
    descricao2: rawString(raw, "descricao2"),
    diferenciais: rawArray(raw, "diferenciais"),
    capa: rawCover(raw),
    galeria: rawGallery(raw),
    updatedAt: row.updated_at,
  };
}

async function getLancamentosData(editId?: string) {
  const pool = getPool();
  const [listResult, editResult] = await Promise.all([
    pool.query(`
      select id, kenlo_codigo, nome, slug, bairro_nome, cidade, estado,
        imovel_id, raw, ativo, updated_at
      from lancamentos
      order by ativo desc, updated_at desc nulls last, nome
    `),
    editId
      ? pool.query(
          `
            select id, kenlo_codigo, nome, slug, bairro_nome, cidade, estado,
              imovel_id, raw, ativo, updated_at
            from lancamentos
            where id = $1
            limit 1
          `,
          [editId]
        )
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    lancamentos: listResult.rows.map(mapLancamento),
    editar: editResult.rows[0] ? mapLancamento(editResult.rows[0]) : null,
  };
}

export default async function AdminLancamentosPage({ searchParams }: PageProps) {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const data = await getLancamentosData(params.editar);

  return (
    <main className="site-container min-h-screen bg-offwhite py-24 text-navy">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-navy/10 pb-6 md:flex-row md:items-start">
          <div>
            <Link className="mb-4 inline-block text-xs text-sand hover:text-terra" href="/admin">
              Voltar ao painel
            </Link>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-terra">
              Admin
            </p>
            <h1 className="text-2xl font-light">Lançamentos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand">
              Cadastre páginas individuais de lançamentos e alimente automaticamente o dropdown do Header.
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
            Lançamento atualizado.
          </p>
        ) : null}
        {params.erro ? (
          <p className="mb-5 border border-terra/20 bg-white px-4 py-3 text-sm text-terra">
            Não foi possível salvar. Confira os campos e o tamanho das imagens.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.45fr]">
          <div className="border border-navy/10 bg-white">
            <div className="border-b border-navy/10 p-4">
              <h2 className="text-sm font-semibold">
                Lançamentos cadastrados
              </h2>
            </div>
            <div className="divide-y divide-navy/10">
              {data.lancamentos.length > 0 ? (
                data.lancamentos.map((lancamento) => (
                  <div className="p-4" key={lancamento.id}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{lancamento.nome}</p>
                        <p className="mt-1 text-xs text-sand">
                          /lancamentos/{lancamento.slug}
                        </p>
                      </div>
                      <span
                        className={`border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
                          lancamento.ativo
                            ? "border-emerald-700/10 bg-emerald-50 text-emerald-900"
                            : "border-navy/10 bg-offwhite text-sand"
                        }`}
                      >
                        {lancamento.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lancamento.ativo ? (
                        <Link
                          className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
                          href={`/lancamentos/${lancamento.slug}`}
                          target="_blank"
                        >
                          Ver
                        </Link>
                      ) : null}
                      <Link
                        className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
                        href={`/admin/lancamentos?editar=${lancamento.id}`}
                      >
                        Editar
                      </Link>
                      <form action={deleteLancamentoAction}>
                        <input name="id" type="hidden" value={lancamento.id} />
                        <button
                          className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
                          type="submit"
                        >
                          Excluir
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-sm text-sand">Nenhum lançamento cadastrado ainda.</p>
              )}
            </div>
          </div>

          <div className="border border-navy/10 bg-white p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-navy/10 pb-4">
              <div>
                <h2 className="text-sm font-semibold">
                  {data.editar ? "Editar lançamento" : "Novo lançamento"}
                </h2>
                <p className="mt-1 text-xs text-sand">
                  Os campos editoriais são exibidos na página pública do lançamento.
                </p>
              </div>
              {data.editar ? (
                <Link className="text-xs text-sand hover:text-terra" href="/admin/lancamentos">
                  Novo
                </Link>
              ) : null}
            </div>
            <LancamentoForm lancamento={data.editar} />
          </div>
        </div>
      </section>
    </main>
  );
}
