import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { ensureBannerSchema, listBanners } from "@/lib/admin/banners";
import { BannerManager } from "@/components/admin/BannerManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banners da Home | Admin", robots: { index: false, follow: false } };

export default async function BannersPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["admin", "editor"].includes(user.role)) redirect("/admin/login");
  try {
    await ensureBannerSchema();
    const banners = await listBanners();
    return <main className="site-container min-h-screen py-24 text-navy">
      <Link className="text-sm text-terra underline" href="/admin">Voltar ao painel</Link>
      <h1 className="mb-8 mt-4 text-3xl font-light">Banners da Home</h1>
      <BannerManager banners={banners} />
    </main>;
  } catch {
    return <main className="site-container min-h-screen py-24"><Link href="/admin">Voltar ao painel</Link><p role="alert" className="mt-6">Não foi possível carregar os banners. Verifique a conexão e a permissão de criação de tabelas no banco.</p></main>;
  }
}
