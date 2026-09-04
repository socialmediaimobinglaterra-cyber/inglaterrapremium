import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BairroForm } from "@/components/admin/BairroForm";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { getPool } from "@/lib/db";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bairros Admin | Inglaterra Premium",
};

type PageProps = {
  searchParams: Promise<{
    editar?: string;
    ok?: string;
  }>;
};

type BairroAdmin = {
  id: string;
  nome: string;
  slug: string;
  cidade: string;
  estado: string;
  imagemCapa: string | null;
  descricao: string | null;
  faq: Array<{ pergunta: string; resposta: string }>;
  ativo: boolean;
  updatedAt: Date;
};

function parseFaq(value: unknown): Array<{ pergunta: string; resposta: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const pergunta = record.pergunta ?? record.question;
      const resposta = record.resposta ?? record.answer;

      if (typeof pergunta !== "string" || typeof resposta !== "string") return null;
      if (!pergunta.trim() || !resposta.trim()) return null;

      return { pergunta: pergunta.trim(), resposta: resposta.trim() };
    })
    .filter((item): item is { pergunta: string; resposta: string } => item !== null);
}

function mapBairro(row: Record<string, any>): BairroAdmin {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    cidade: row.cidade ?? "Londrina",
    estado: row.estado ?? "PR",
    imagemCapa:
      typeof row.imagem_capa === "string" && row.imagem_capa.trim()
        ? row.imagem_capa.trim()
        : null,
    descricao: typeof row.descricao === "string" && row.descricao.trim() ? row.descricao : null,
    faq: parseFaq(row.faq),
    ativo: row.ativo,
    updatedAt: row.updated_at,
  };
}

async function getBairrosData(editId?: string) {
  const pool = getPool();
  const result = await pool.query(`
    select id, nome, slug, cidade, estado, imagem_capa, descricao, faq, ativo, updated_at
    from bairros
    order by nome
  `);

  const bairros = result.rows.map(mapBairro);
  const editar =
    bairros.find((bairro) => bairro.id === editId) ??
    (editId ? null : bairros[0] ?? null);

  return { bairros, editar };
}

export default async function AdminBairrosPage({ searchParams }: PageProps) {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const data = await getBairrosData(params.editar);

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
            <h1 className="text-2xl font-light">Bairros</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand">
              Edite imagem de capa, texto institucional e FAQ das páginas públicas de bairro.
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
            Bairro atualizado.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.45fr]">
          <div className="border border-navy/10 bg-white">
            <div className="border-b border-navy/10 p-4">
              <h2 className="text-sm font-semibold">Bairros cadastrados</h2>
            </div>
            <div className="divide-y divide-navy/10">
              {data.bairros.length > 0 ? (
                data.bairros.map((bairro) => (
                  <div className="p-4" key={bairro.id}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{bairro.nome}</p>
                        <p className="mt-1 text-xs text-sand">/bairros/{bairro.slug}</p>
                      </div>
                      <span
                        className={`border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
                          bairro.imagemCapa
                            ? "border-emerald-700/10 bg-emerald-50 text-emerald-900"
                            : "border-navy/10 bg-offwhite text-sand"
                        }`}
                      >
                        {bairro.imagemCapa ? "Com capa" : "Sem capa"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bairro.ativo ? (
                        <Link
                          className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
                          href={`/bairros/${bairro.slug}`}
                          target="_blank"
                        >
                          Ver
                        </Link>
                      ) : null}
                      <Link
                        className="border border-navy/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-navy hover:border-terra hover:text-terra"
                        href={`/admin/bairros?editar=${bairro.id}`}
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-sm text-sand">Nenhum bairro cadastrado ainda.</p>
              )}
            </div>
          </div>

          <div className="border border-navy/10 bg-white p-5 md:p-6">
            <div className="mb-6 border-b border-navy/10 pb-4">
              <h2 className="text-sm font-semibold">
                {data.editar ? `Editar ${data.editar.nome}` : "Editar bairro"}
              </h2>
              <p className="mt-1 text-xs text-sand">
                Os campos editoriais aparecem apenas quando preenchidos.
              </p>
            </div>
            <BairroForm bairro={data.editar} />
          </div>
        </div>
      </section>
    </main>
  );
}
