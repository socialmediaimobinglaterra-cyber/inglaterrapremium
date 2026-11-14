import Image from "next/image";
import Link from "next/link";
import { BLOG_URL } from "@/lib/blog-posts";
import { organization } from "@/lib/site";
import { contactSettings } from "@/lib/contact-settings";
import { PRIVACY_POLICY_PATH, PRIVACY_POLICY_TITLE } from "@/lib/privacy-policy";

const footerColumns = [
  { title: "Comprar", links: ["Apartamentos", "Casas", "Coberturas", "Terrenos"] },
  { title: "Produtos", links: ["Condomínios", "Inglaterra BTS", "Lançamentos"] },
  { title: "Empresa", links: ["Sobre Nós", "Diretoria", "Seja Corretor", "Imprensa"] },
  { title: "Conteúdo", links: ["Notícias", "Bairros", "Newsletter", "Instagram"] },
];

export function Footer() {
  return (
    <footer className="site-container bg-navy pb-6 pt-12 text-white md:pb-7 md:pt-16">
      <div className="mb-9 grid grid-cols-1 gap-9 md:mb-13 md:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:gap-12">
        <div>
          <div className="mb-6">
            <Image
              alt="Inglaterra Premium"
              height={44}
              src="/images/logo-white.png"
              width={219}
              className="h-11 w-auto"
            />
          </div>
          <p className="max-w-[220px] text-detail leading-[1.9] text-white/75">
            Imóveis de alto padrão com curadoria e excelência há 25 anos em
            Londrina e região.
          </p>
          <div className="mt-5 flex flex-col gap-1.5">
            <p className="text-caption text-white/75">CRECI-PR 12.345</p>
            <p className="text-caption text-white/75"><a href={contactSettings.phoneHref}>{contactSettings.phone}</a></p>
            <p className="break-words text-caption text-white/75">{organization.email}</p>
            <p className="text-caption text-white/75">
              Av. Duque de Caxias, 1726 · Londrina, PR
            </p>
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="mb-[18px] text-caption font-medium uppercase tracking-[0.3em] text-sand">
              {column.title}
            </p>
            <div className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <Link
                  className="nav-focus text-detail text-white/75 transition duration-200 hover:text-white"
                  href={link === "Seja Corretor" ? contactSettings.careers : link === "Notícias" ? BLOG_URL : link === "Instagram" ? "https://www.instagram.com/inglaterrapremium/" : link === "Newsletter" ? "/#newsletter" : "#"}
                  target={["Seja Corretor", "Notícias", "Instagram"].includes(link) ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  key={link}
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 h-[3px] bg-terra" />
      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center md:gap-0">
        <p className="text-caption text-white/75">
          © 2026 Inglaterra Premium · Todos os direitos reservados
        </p>
        <p className="text-caption text-white/75">
          <Link className="nav-focus hover:underline" href={PRIVACY_POLICY_PATH}>{PRIVACY_POLICY_TITLE}</Link> · Termos de Uso
        </p>
      </div>
    </footer>
  );
}
