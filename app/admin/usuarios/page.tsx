import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAdminUser, listAdminUsers } from "@/lib/admin/auth";
import { logoutAction } from "../actions";
import { inviteUserAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usuários Admin | Inglaterra Premium",
};

type PageProps = {
  searchParams: Promise<{
    ok?: string;
    erro?: string;
  }>;
};

function roleLabel(role: string) {
  return role === "admin" ? "Admin" : "Editor";
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) redirect("/admin/login");
  if (currentUser.role !== "admin") notFound();

  const [users, params] = await Promise.all([listAdminUsers(), searchParams]);

  return (
    <main className="site-container min-h-screen bg-offwhite py-24 text-navy">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <Link className="mb-4 inline-block text-xs text-sand hover:text-terra" href="/admin">
              Voltar ao painel
            </Link>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-terra">
              Admin
            </p>
            <h1 className="text-2xl font-light">Usuários e convites</h1>
            <p className="mt-2 text-sm text-sand">
              Apenas admins podem convidar novos usuários.
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

        {params.ok === "convite" ? (
          <p className="mb-5 border border-navy/10 bg-white px-4 py-3 text-sm text-sand">
            Usuário convidado. Ele já pode entrar em /admin/login usando código por e-mail.
          </p>
        ) : null}
        {params.erro === "convite" ? (
          <p className="mb-5 border border-terra/20 bg-terra/5 px-4 py-3 text-sm text-terra">
            Confira o e-mail e o papel selecionado.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden border border-navy/10 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-offwhite text-[10px] uppercase tracking-[0.18em] text-sand">
                <tr>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 font-medium">Convidado por</th>
                  <th className="px-4 py-3 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr className="border-t border-navy/10" key={user.id}>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{roleLabel(user.role)}</td>
                    <td className="px-4 py-3 text-sand">
                      {user.invitedByEmail ?? "Seed inicial"}
                    </td>
                    <td className="px-4 py-3 text-sand">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="border border-navy/10 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold">Convidar usuário</h2>
            <form action={inviteUserAction} className="flex flex-col gap-4">
              <label>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-sand">
                  E-mail
                </span>
                <input
                  className="w-full border border-navy/15 bg-offwhite px-4 py-3 text-sm outline-none focus:border-terra"
                  name="email"
                  placeholder="editor@exemplo.com"
                  required
                  type="email"
                />
              </label>
              <label>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-sand">
                  Papel
                </span>
                <select
                  className="w-full border border-navy/15 bg-offwhite px-4 py-3 text-sm outline-none focus:border-terra"
                  defaultValue="editor"
                  name="role"
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button
                className="bg-terra px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#6b2a0f]"
                type="submit"
              >
                Convidar
              </button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
