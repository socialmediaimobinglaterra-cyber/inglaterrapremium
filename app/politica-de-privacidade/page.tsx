import type { Metadata } from "next";
import { privacyPolicyContent } from "@/lib/privacy-policy-content";
import { PRIVACY_POLICY_PATH } from "@/lib/privacy-policy";

export const metadata: Metadata = {
  title: "Política de Privacidade e Proteção de Dados | Inglaterra Premium",
  description: "Política de Privacidade e Proteção de Dados da Imobiliária Inglaterra: informações sobre coleta, uso dos dados e canais de contato.",
  alternates: { canonical: PRIVACY_POLICY_PATH },
};

function PolicyText({ text }: { text: string }) {
  return text.split(/(https:\/\/www\.imobiliariainglaterra\.com\.br\/|inteligencia@imobiliariainglaterra\.com\.br)/g).map((part, index) => {
    if (part.startsWith("https://") || part === "inteligencia@imobiliariainglaterra.com.br") {
      return <a key={index} className="break-words underline decoration-terra/50 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra" target={part.startsWith("https://") ? "_blank" : undefined} rel="noopener noreferrer" href={part.startsWith("https://") ? part : `mailto:${part}`}>{part}</a>;
    }
    return part;
  });
}

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-offwhite text-navy">
      <article className="site-container py-16 md:py-24">
        <div className="max-w-[880px]">
          <h1 className="mb-10 text-[30px] font-light leading-tight md:text-[42px]">
            Política de Privacidade e Proteção de Dados
          </h1>
          {privacyPolicyContent.map((block, index) => block.kind === "heading" ? (
            <h2 className="mb-4 mt-10 text-xl font-light leading-snug md:text-2xl" key={index}>{block.text}</h2>
          ) : block.kind === "subheading" ? (
            <h3 className="mb-4 mt-6 text-lg font-medium" key={index}>{block.text}</h3>
          ) : (
            <p className="mb-4 whitespace-pre-line break-words text-sm leading-[1.85]" key={index}><PolicyText text={block.text} /></p>
          ))}
        </div>
      </article>
    </main>
  );
}
