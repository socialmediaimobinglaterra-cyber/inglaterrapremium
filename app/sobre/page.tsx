import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre o Grupo Inglaterra | Imobiliária em Londrina",
  description:
    "Conheça o Grupo Inglaterra e a Inglaterra Premium: 25 anos na Avenida Inglaterra, em Londrina, com atuação em imóveis, locação, vendas, administração e alto padrão.",
};

const unidades = [
  {
    titulo: "Imobiliária Inglaterra",
    paragrafos: [
      "A operação que deu origem ao grupo. Atua com locação, administração de imóveis e venda de imóveis de terceiros, atendendo proprietários, compradores e locatários. Trabalha com imóveis residenciais, comerciais e terrenos, em diferentes faixas de valor.",
      "Oferece também o Inglaterra Antecipa: o proprietário com imóvel administrado pela Imobiliária Inglaterra pode antecipar parte dos recebimentos futuros de aluguel, sem precisar vender o imóvel.",
    ],
  },
  {
    titulo: "Inglaterra Premium",
    paragrafos: [
      "Criada em 2023 para atender o mercado de alto padrão de Londrina. Concentra a venda e locação de imóveis premium, lançamentos, empreendimentos na planta e o atendimento a investidores.",
    ],
  },
];

const valores = [
  ["R", "Responsabilidade"],
  ["E", "Entusiasmo"],
  ["A", "Atividade"],
  ["L", "Liberdade"],
  ["I", "Inovação"],
  ["Z", "Zelo"],
  ["A", "Atuação"],
  ["R", "Respeito"],
];

const diretores = [
  {
    nome: "Wagner Lopes Redon",
    cargo: "Diretor Comercial de Locação",
    foto: "/images/diretoria/wagner.jpg",
    descricao:
      "Responsável pela operação de locação e administração de imóveis do grupo. Trabalha para que proprietários e locatários tenham a mesma clareza sobre cada etapa do processo.",
  },
  {
    nome: "Vanderson Lopes Redon",
    cargo: "Diretor Comercial de Vendas",
    foto: "/images/diretoria/vanderson.jpg",
    descricao:
      "Conduz a área de vendas do grupo, do imóvel residencial ao alto padrão. Acompanha de perto o mercado de Londrina e as oportunidades que ele abre a cada ciclo.",
  },
  {
    nome: "Luis Carlos Itakura",
    cargo: "Diretor Administrativo",
    foto: "/images/diretoria/luis.jpg",
    descricao:
      "Cuida da estrutura administrativa, financeira e jurídica do grupo. É o que garante que cada negócio fechado tenha processo sólido por trás.",
  },
];

export default function SobrePage() {
  return (
    <main className="bg-offwhite text-navy">
      <section className="site-container py-[120px] md:py-[160px]">
        <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
          Sobre nós
        </p>
        <h1 className="mb-8 max-w-[840px] text-[clamp(36px,7vw,72px)] font-light leading-[1.05] tracking-[0.01em]">
          25 anos na Avenida Inglaterra, em Londrina
        </h1>
        <div className="flex max-w-[720px] flex-col gap-5 text-[15px] leading-[1.9] text-navy md:text-[16px]">
          <p>
            O Grupo Inglaterra nasceu em 2001, na Avenida Inglaterra, em
            Londrina. O nome veio daí — do endereço onde tudo começou.
          </p>
          <p>
            Continuamos na mesma avenida, hoje em sede própria, mais ampla e
            moderna. De lá, acompanhamos o crescimento da cidade e a
            transformação do seu mercado imobiliário, negócio a negócio.
          </p>
        </div>
      </section>

      <section className="site-container pb-[120px] md:pb-[160px]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {unidades.map((unidade) => (
            <article
              className="border border-navy/10 bg-white p-6 md:p-8"
              key={unidade.titulo}
            >
              <h2 className="mb-5 text-[26px] font-light leading-tight md:text-[34px]">
                {unidade.titulo}
              </h2>
              <div className="flex flex-col gap-4 text-[14px] leading-[1.85] text-navy md:text-[15px]">
                {unidade.paragrafos.map((paragrafo) => (
                  <p key={paragrafo}>{paragrafo}</p>
                ))}
                {unidade.titulo === "Inglaterra Premium" ? (
                  <p>
                    Atuamos também com{" "}
                    <Link
                      className="text-terra underline-offset-4 transition hover:underline"
                      href="/bts"
                    >
                      BTS (Built to Suit)
                    </Link>{" "}
                    e construções sob medida — para quem precisa de um imóvel
                    projetado para uma operação específica, não de um imóvel
                    pronto.
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="site-container pb-[120px] md:pb-[160px]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          <article>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
              Nossa missão
            </p>
            <h2 className="sr-only">Nossa missão</h2>
            <p className="text-[15px] leading-[1.9] text-navy md:text-[16px]">
              Dar apoio completo a quem compra, vende ou aluga um imóvel — do
              primeiro contato à assinatura do contrato. Isso inclui a parte
              comercial, mas também a jurídica, a financeira e a burocrática,
              que é onde a maioria das pessoas trava. Atender bem, para nós, é
              atender de perto: entender o que cada cliente precisa antes de
              apresentar uma solução.
            </p>
          </article>
          <article>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
              Nossa visão
            </p>
            <h2 className="sr-only">Nossa visão</h2>
            <p className="text-[15px] leading-[1.9] text-navy md:text-[16px]">
              Ir além do bom negócio. Cada imóvel representa um plano de vida —
              mudar de casa, investir, começar algo novo. Queremos estar do
              lado certo dessa história.
            </p>
          </article>
        </div>
      </section>

      <section className="site-container pb-[120px] md:pb-[160px]">
        <p className="mb-10 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
          Valores
        </p>
        <h2 className="sr-only">Valores REALIZAR</h2>
        <div className="flex flex-col gap-4">
          {valores.map(([letra, palavra]) => (
            <div className="flex items-baseline gap-5" key={`${letra}-${palavra}`}>
              <span className="w-8 text-[34px] font-light leading-none text-terra md:text-[46px]">
                {letra}
              </span>
              <span className="text-[22px] font-light leading-tight text-navy md:text-[34px]">
                {palavra}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="site-container pb-[120px] md:pb-[160px]">
        <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-terra">
          Diretoria
        </p>
        <div className="mb-12 max-w-[760px]">
          <h2 className="mb-5 text-[clamp(32px,6vw,58px)] font-light leading-[1.08] tracking-[0.01em]">
            Quem está à frente
          </h2>
          <p className="text-[15px] leading-[1.9] text-navy md:text-[16px]">
            Três diretores, cada um responsável por uma frente da operação — e
            todos acessíveis a quem precisa resolver algo.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {diretores.map((diretor) => (
            <article className="bg-white" key={diretor.nome}>
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  alt={`${diretor.nome} — ${diretor.cargo}, Grupo Inglaterra em Londrina`}
                  className="object-cover"
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  src={diretor.foto}
                />
              </div>
              <div className="p-6">
                <h3 className="mb-1 text-[22px] font-light leading-tight">
                  {diretor.nome}
                </h3>
                <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-terra">
                  {diretor.cargo}
                </p>
                <p className="text-[13px] leading-[1.85] text-navy">
                  {diretor.descricao}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="site-container pb-[120px] md:pb-[160px]">
        <div className="bg-navy px-6 py-12 text-white md:px-12 md:py-16">
          <h2 className="mb-4 text-[clamp(30px,5vw,54px)] font-light leading-[1.08]">
            Vamos conversar?
          </h2>
          <p className="mb-8 max-w-[560px] text-[15px] leading-[1.9] text-white/75 md:text-[16px]">
            Se você quer comprar, vender, alugar ou investir em Londrina, nossa
            equipe está pronta para ajudar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="bg-terra px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-[#6b2a0f]"
              href="/contato"
            >
              Falar com a equipe
            </Link>
            <Link
              className="border border-white/40 px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white transition hover:border-white"
              href="/imoveis"
            >
              Ver imóveis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
