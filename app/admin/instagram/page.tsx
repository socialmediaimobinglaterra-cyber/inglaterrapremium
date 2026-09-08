import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InstagramPostsManager } from "@/components/admin/InstagramPostsManager";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { ensureInstagramPostsTable } from "@/lib/admin/instagram-schema";
import { getPool } from "@/lib/db";
import { type InstagramPost } from "@/lib/queries/instagram-posts";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Instagram Admin | Inglaterra Premium",
};

type PageProps = {
  searchParams: Promise<{
    ok?: string;
    erro?: string;
  }>;
};

function mapPost(row: Record<string, any>): InstagramPost {
  return {
    id: row.id,
    url: row.url,
    imagem: typeof row.imagem === "string" && row.imagem.trim() ? row.imagem.trim() : null,
    legenda: typeof row.legenda === "string" && row.legenda.trim() ? row.legenda.trim() : null,
    ordem: Number(row.ordem ?? 0),
    ativo: Boolean(row.ativo),
    createdAt: row.created_at,
  };
}

async function getInstagramPosts() {
  const pool = getPool();
  await ensureInstagramPostsTable(pool);

  const result = await pool.query(`
    select id, url, imagem, legenda, ordem, ativo, created_at
    from instagram_posts
    order by ordem asc, created_at asc
  `);

  return result.rows.map(mapPost);
}

export default async function AdminInstagramPage({ searchParams }: PageProps) {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const posts = await getInstagramPosts();

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
            <h1 className="text-2xl font-light">Instagram da Home</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand">
              Gerencie a galeria própria exibida na seção de Instagram da Home. Cada imagem abre o post original em nova aba.
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
            Posts do Instagram atualizados.
          </p>
        ) : null}

        {params.erro ? (
          <p className="mb-5 border border-terra/20 bg-terra/5 px-4 py-3 text-sm text-terra">
            Não foi possível concluir a ação. Tente novamente.
          </p>
        ) : null}

        <InstagramPostsManager posts={posts} />
      </section>
    </main>
  );
}
