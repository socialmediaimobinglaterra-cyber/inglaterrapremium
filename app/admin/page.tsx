import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | Inglaterra Premium",
};

export default async function AdminPage() {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  return (
    <main className="site-container min-h-screen bg-offwhite py-24 text-navy">
      <section className="mx-auto max-w-3xl border border-navy/10 bg-white p-6 md:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-navy/10 pb-6 md:flex-row md:items-start">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-terra">
              Painel Admin
            </p>
            <h1 className="text-2xl font-light">Inglaterra Premium</h1>
            <p className="mt-2 text-sm text-sand">
              {user.email} · {user.role}
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

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            className="border border-navy/10 bg-offwhite p-5 transition hover:border-terra"
            href="/admin/curadoria"
          >
            <h2 className="mb-2 text-sm font-semibold">Curadoria</h2>
            <p className="text-sm leading-relaxed text-sand">
              Incluir ou excluir imoveis do site sem alterar o filtro automatico.
            </p>
          </Link>
          <div className="border border-navy/10 bg-offwhite p-5">
            <h2 className="mb-2 text-sm font-semibold">Conteúdo</h2>
            <p className="text-sm leading-relaxed text-sand">
              Base de acesso pronta. Os formulários de conteúdo entram nas
              próximas fases.
            </p>
          </div>
          <Link
            className="border border-navy/10 bg-offwhite p-5 transition hover:border-terra"
            href="/admin/lancamentos"
          >
            <h2 className="mb-2 text-sm font-semibold">Lançamentos</h2>
            <p className="text-sm leading-relaxed text-sand">
              Cadastrar, editar e remover páginas individuais de lançamentos.
            </p>
          </Link>
          {user.role === "admin" ? (
            <Link
              className="border border-navy/10 bg-offwhite p-5 transition hover:border-terra"
              href="/admin/usuarios"
            >
              <h2 className="mb-2 text-sm font-semibold">Usuários</h2>
              <p className="text-sm leading-relaxed text-sand">
                Gerenciar convites e papéis do painel.
              </p>
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
