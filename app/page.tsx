import type { Metadata } from "next";
import Image from "next/image";
import { getPool } from "@/lib/db";
import { imageUrlOrFallback } from "@/lib/images";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imóveis de alto padrão em Londrina | Inglaterra Premium",
  description:
    "Curadoria de imóveis premium em Londrina, com casas, apartamentos, condomínios e lançamentos nos bairros mais valorizados da cidade.",
};

type Foto = {
  URLArquivo?: string;
  Principal?: string | number;
};

type FeaturedProperty = {
  id: string;
  title: string;
  location: string;
  area: string;
  bedrooms: number;
  price: string;
  tag: string;
  image: string;
};

type Bairro = {
  name: string;
  cidade: string;
  imoveis: number;
  image: string | null;
};

const PRODUCTS = [
  {
    title: "Imóveis em Condomínios",
    desc: "Casas e apartamentos à venda em condomínios fechados de alto padrão em Londrina, com segurança 24h e localização privilegiada nos bairros mais valorizados da cidade.",
    cta: "Ver Condomínios",
    label: "CONDOMÍNIOS",
    image: "/images/capa-hero.jpg",
  },
  {
    title: "Inglaterra BTS",
    desc: "Built to Suit corporativo em Londrina — imóveis projetados e construídos sob medida para a operação da sua empresa, com contrato de locação de longo prazo.",
    cta: "Conheça o BTS",
    label: "BTS",
    image: "/images/capa-hero.jpg",
  },
  {
    title: "Lançamentos",
    desc: "Acesso antecipado a lançamentos imobiliários de alto padrão em Londrina, antes da divulgação ao mercado, com condições exclusivas de pré-lançamento.",
    cta: "Ver Lançamentos",
    label: "LANÇAMENTOS",
    image: "/images/capa-hero.jpg",
  },
];

const DIRECTORS = [
  {
    name: "Wagner Lopes Redon",
    title: "Diretor de Locação",
    quote:
      '"Comecei no mercado imobiliário ainda jovem, acompanhando meu pai em visitas a imóveis aos sábados, e nunca mais quis fazer outra coisa. Para mim, a essência da Inglaterra Premium está em cuidar de cada imóvel administrado como se fosse o nosso próprio patrimônio."',
    image: "/images/diretoria/wagner.jpg",
  },
  {
    name: "Luis Carlos Itakura",
    title: "Diretor Administrativo",
    quote:
      '"Vim de uma trajetória em gestão e finanças, e encontrei na Inglaterra Premium o desafio de dar estrutura a um mercado que exige precisão em cada detalhe. A essência da marca, pra mim, é a solidez que sustenta, nos bastidores, a confiança que o cliente sente na hora da venda."',
    image: "/images/diretoria/luis.jpg",
  },
  {
    name: "Vanderson Lopes Redon",
    title: "Diretor de Vendas",
    quote:
      '"Entrei para o mercado imobiliário ao perceber que minha vocação sempre foi entender pessoas antes de entender imóveis. A essência da Inglaterra Premium, na minha visão, é nunca vender um imóvel sem antes entender o que aquele cliente realmente está construindo."',
    image: "/images/diretoria/vanderson.jpg",
  },
];

const NEWS = [
  {
    cat: "Mercado",
    date: "08 Ago 2026",
    title: "Alto padrão registra recorde de valorização em Londrina no 1º semestre",
    excerpt:
      "Imóveis de luxo em Londrina lideraram a valorização imobiliária da cidade, com alta de até 18% em 12 meses nos bairros Gleba Palhano e Bela Suíça, segundo levantamento da Inglaterra Premium.",
    image: "/images/capa-hero.jpg",
  },
  {
    cat: "Tendências",
    date: "01 Ago 2026",
    title: "Build to Suit: a nova fronteira para quem não abre mão da exclusividade",
    excerpt:
      "Clientes de alta renda de Londrina migram para imóveis 100% personalizados. Entenda como funciona o modelo Build to Suit da Inglaterra Premium, do terreno ao projeto pronto.",
    image: "/images/capa-hero.jpg",
  },
  {
    cat: "Legislação",
    date: "24 Jul 2026",
    title: "Novas regras para condomínios de luxo: o que muda em 2026",
    excerpt:
      "As alterações aprovadas no código civil afetam cláusulas de convenção em empreendimentos verticais de alto padrão em todo o Brasil, incluindo os condomínios de Londrina.",
    image: "/images/capa-hero.jpg",
  },
];

const DIFFS = [
  {
    num: "01",
    title: "Marca Premium",
    text: "25 anos construindo uma das imobiliárias de alto padrão mais respeitadas de Londrina, com reconhecimento em todo o Paraná.",
  },
  {
    num: "02",
    title: "Carteira Qualificada",
    text: "Portfólio com imóveis de alto padrão selecionados e clientes com real poder de compra.",
  },
  {
    num: "03",
    title: "Suporte Completo",
    text: "Treinamentos, CRM dedicado, apoio jurídico e marketing profissional para cada corretor.",
  },
  {
    num: "04",
    title: "Remuneração Atrativa",
    text: "Comissionamento competitivo com bonificações por desempenho e carteira fidelizada.",
  },
];

const TICKER = [
  "Londrina",
  "Gleba Palhano",
  "Terra Bonita",
  "Bela Suíça",
  "Aurora",
  "Nova Prochet",
  "Jardim Higienópolis",
  "Condomínios de Alto Padrão",
  "Residenciais de Luxo",
];

function currency(value: string | number | null) {
  if (value === null) return "Sob consulta";
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function area(value: string | number | null) {
  if (value === null) return "Área sob consulta";
  return `${Number(value).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  })} m²`;
}

function getMainImage(fotos: Foto[] | null) {
  const all = Array.isArray(fotos) ? fotos : [];
  return imageUrlOrFallback(
    all.find((foto) => String(foto.Principal) === "1")?.URLArquivo ??
      all[0]?.URLArquivo
  );
}

async function getHomeData() {
  const pool = getPool();
  const [featuredResult, bairrosResult, statsResult] = await Promise.all([
    pool.query(`
      select kenlo_codigo, titulo, bairro_nome, cidade, area_util, area_total,
        dormitorios, preco_venda, preco_locacao, tipo, fotos
      from imoveis
      where ativo = true and ativo_no_site = true
      order by coalesce(preco_venda, preco_locacao) desc nulls last
      limit 4
    `),
    pool.query(`
      select b.nome, b.cidade, b.imagem_capa, count(i.id)::int as imoveis
      from bairros b
      left join imoveis i on i.bairro_id = b.id and i.ativo = true and i.ativo_no_site = true
      where b.ativo = true
      group by b.id, b.nome, b.cidade, b.imagem_capa
      order by imoveis desc, b.nome
      limit 6
    `),
    pool.query(`
      select
        count(*)::int as total_imoveis,
        count(distinct bairro_id)::int as total_bairros
      from imoveis
      where ativo = true and ativo_no_site = true
    `),
  ]);

  const featured: FeaturedProperty[] = featuredResult.rows.map((row, index) => ({
    id: String(index + 1).padStart(2, "0"),
    title: row.titulo,
    location: `${row.bairro_nome}, ${row.cidade ?? "Londrina"}`,
    area: area(row.area_util ?? row.area_total),
    bedrooms: row.dormitorios ?? 0,
    price: currency(row.preco_venda ?? row.preco_locacao),
    tag: index === 0 ? "EXCLUSIVO" : index === 1 ? "DESTAQUE" : "PREMIUM",
    image: getMainImage(row.fotos),
  }));

  const bairros: Bairro[] = bairrosResult.rows.map((row) => ({
    name: row.nome,
    cidade: row.cidade ?? "Londrina",
    imoveis: row.imoveis,
    image:
      typeof row.imagem_capa === "string" && row.imagem_capa.trim()
        ? row.imagem_capa.trim()
        : null,
  }));

  const totals = statsResult.rows[0] ?? { total_imoveis: 0, total_bairros: 0 };

  return { featured, bairros, totals };
}

function Rule({ label, right }: { label?: string; right?: string }) {
  return (
    <div className="border-y border-navy/10">
      <div className="site-container flex items-center gap-5 py-4">
        {label ? (
          <span className="max-w-[62vw] overflow-hidden text-ellipsis whitespace-nowrap text-[8px] uppercase tracking-[0.2em] text-navy md:tracking-[0.4em]">
            {label}
          </span>
        ) : null}
        <div className="h-px flex-1 bg-navy/10" />
        {right ? (
          <span className="whitespace-nowrap text-[8px] uppercase tracking-[0.4em] text-navy">
            {right}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Anchor({ label }: { label: string }) {
  return (
    <a
      href="#"
      className="border-b border-terra pb-0.5 text-[9px] uppercase tracking-[0.28em] text-terra"
    >
      {label}
    </a>
  );
}

function HeroSearch() {
  return (
    <div className="w-full border border-white/50 bg-offwhite/90 px-5 py-[22px] shadow-[0_20px_48px_rgba(16,26,38,0.18)] backdrop-blur-[18px] md:max-w-[54vw] md:px-10 md:py-8">
      <div className="mb-3.5 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-terra" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-terra">
          Busca inteligente · Inglaterra AI
        </span>
      </div>
      <form className="flex flex-col gap-2.5 border-b border-navy/10 pb-3 md:flex-row md:gap-0 md:pb-0">
        <input
          className="flex-1 border-0 bg-transparent py-1 text-[15px] italic text-navy outline-none placeholder:text-navy/45 md:py-2.5 md:text-[19px]"
          placeholder="Descreva o imóvel que você procura..."
        />
        <button
          className="py-1 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-terra md:py-2.5 md:pl-5 md:text-right"
          type="button"
        >
          Perguntar →
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          "Apartamento na Gleba Palhano até R$ 3 milhões",
          "Casa com 4 suítes no Terra Bonita",
        ].map((example) => (
          <button
            className="rounded-full border border-navy/10 px-3 py-1.5 text-[10.5px] text-navy"
            key={example}
            type="button"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

function PropCard({ p, h }: { p: FeaturedProperty; h: string }) {
  return (
    <article
      className={`group relative h-[340px] cursor-pointer overflow-hidden bg-[#1e1e1e] ${h}`}
    >
      <Image
        alt={`${p.title} — ${p.location}`}
        className="absolute inset-0 h-full w-full object-cover opacity-[0.82] transition duration-700 group-hover:scale-105 group-hover:opacity-70"
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        src={imageUrlOrFallback(p.image)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-transparent" />
      <div className="absolute left-[22px] right-[22px] top-5 flex items-start justify-between">
        <span className="text-[32px] font-light leading-none text-white/75">
          {p.id}
        </span>
        <span className="border border-white/25 px-2.5 py-1 text-[8px] uppercase tracking-[0.38em] text-white/80">
          {p.tag}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-[22px] pt-12">
        <p className="mb-2 text-[8px] uppercase tracking-[0.3em] text-terra-light">
          {p.location}
        </p>
        <h3 className="text-xl leading-tight tracking-[0.03em] text-white">
          {p.title}
        </h3>
        <div className="max-h-14 overflow-hidden opacity-100 transition duration-500 md:max-h-0 md:opacity-0 md:group-hover:max-h-14 md:group-hover:opacity-100">
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 pt-2.5 text-[10px] text-white/75">
            <span>{p.area}</span>
            {p.bedrooms > 0 ? (
              <>
                <span className="opacity-40">·</span>
                <span>{p.bedrooms} quartos</span>
              </>
            ) : null}
            <span className="opacity-40">·</span>
            <span>{p.price}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function BairroCard({ b }: { b: Bairro }) {
  return (
    <article className="group relative h-[168px] cursor-pointer overflow-hidden bg-navy md:h-80">
      {b.image ? (
        <Image
          alt={`Bairro ${b.name}, ${b.cidade}`}
          className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-700 group-hover:scale-[1.07] group-hover:opacity-55"
          fill
          sizes="(min-width: 768px) 25vw, 33vw"
          src={imageUrlOrFallback(b.image)}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/70 to-navy/15" />
      <div className="absolute inset-x-2 bottom-2.5 md:inset-x-4 md:bottom-[18px]">
        <p className="mb-1 text-[6px] uppercase tracking-[0.3em] text-terra-light md:text-[7px]">
          {b.cidade}
        </p>
        <h3 className="text-xs leading-tight tracking-[0.02em] text-white md:text-[15px]">
          {b.name}
        </h3>
        <div className="max-h-6 overflow-hidden opacity-100 transition duration-300 md:max-h-0 md:opacity-0 md:group-hover:max-h-6 md:group-hover:opacity-100">
          <p className="pt-1 text-[8px] text-white/75 md:text-[9px]">
            {b.imoveis} imóveis
          </p>
        </div>
      </div>
    </article>
  );
}

function ProdCard({ p }: { p: (typeof PRODUCTS)[0] }) {
  return (
    <article className="group relative h-[420px] cursor-pointer overflow-hidden bg-[#0a0d10] md:h-[540px]">
      <img
        alt={`${p.title} — Inglaterra Premium`}
        className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-700 group-hover:scale-105 group-hover:opacity-50"
        src={p.image}
      />
      <div className="absolute left-[22px] top-[22px]">
        <span className="border border-white/20 px-2.5 py-1 text-[8px] uppercase tracking-[0.4em] text-white/75">
          {p.label}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0d10] to-transparent px-[26px] pb-7 pt-[72px]">
        <h3 className="mb-3 text-2xl leading-tight tracking-[0.04em] text-white">
          {p.title}
        </h3>
        <div className="max-h-[120px] overflow-hidden opacity-100 transition duration-500 md:max-h-0 md:opacity-0 md:group-hover:max-h-[120px] md:group-hover:opacity-100">
          <p className="mb-[18px] text-xs leading-[1.8] text-white/75">
            {p.desc}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] uppercase tracking-[0.22em] text-terra-light">
            {p.cta}
          </span>
          <div className="h-px w-9 bg-terra-light transition-all md:w-[18px] md:group-hover:w-9" />
        </div>
      </div>
    </article>
  );
}

function DirCard({ d }: { d: (typeof DIRECTORS)[0] }) {
  return (
    <article className="border-t-[3px] border-transparent bg-offwhite transition hover:border-terra">
      <div className="aspect-[2/3] overflow-hidden bg-[#c8bdb6]">
        <img
          alt={`${d.name}, ${d.title} da Inglaterra Premium`}
          className="h-full w-full object-cover object-top grayscale-[20%] transition duration-700 hover:scale-[1.03]"
          src={d.image}
        />
      </div>
      <div className="px-[26px] pb-[30px] pt-6">
        <p className="mb-1.5 text-[8px] uppercase tracking-[0.32em] text-terra">
          {d.title}
        </p>
        <h3 className="mb-3.5 text-xl leading-none tracking-[0.03em]">
          {d.name}
        </h3>
        <p className="border-l-2 border-terra pl-3 text-xs italic leading-[1.8] text-navy">
          {d.quote}
        </p>
      </div>
    </article>
  );
}

function NewsCard({ n }: { n: (typeof NEWS)[0] }) {
  return (
    <article className="group cursor-pointer bg-white">
      <div className="h-[200px] overflow-hidden bg-[#c8bdb6]">
        <img
          alt={n.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          src={n.image}
        />
      </div>
      <div className="px-[22px] pb-[26px] pt-[22px]">
        <div className="mb-2.5 flex items-center gap-3.5">
          <span className="text-[8px] uppercase tracking-[0.3em] text-terra">
            {n.cat}
          </span>
          <span className="text-[8px] text-navy">·</span>
          <span className="text-[9px] text-navy">{n.date}</span>
        </div>
        <h3 className="mb-2.5 text-base leading-snug tracking-[0.02em] decoration-navy/30 underline-offset-4 group-hover:underline">
          {n.title}
        </h3>
        <p className="text-[11px] leading-[1.8] text-navy">{n.excerpt}</p>
        <div className="mt-[18px] flex items-center gap-2">
          <span className="text-[8px] uppercase tracking-[0.25em] text-terra">
            Ler mais
          </span>
          <div className="h-px w-3.5 bg-terra transition-all group-hover:w-7" />
        </div>
      </div>
    </article>
  );
}

function TerraButton({ label }: { label: string }) {
  return (
    <button
      className="bg-terra px-[30px] py-[13px] text-[9px] uppercase tracking-[0.25em] text-white transition hover:bg-[#6b2a0f]"
      type="button"
    >
      {label}
    </button>
  );
}

function CaptureForm() {
  return (
    <form className="flex flex-col gap-4 md:gap-5">
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-5">
        <Field label="Nome completo" placeholder="Seu nome" />
        <Field label="Telefone" placeholder="(43) 9 9999-9999" />
      </div>
      <Field label="E-mail" placeholder="seu@email.com" type="email" />
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-5">
        <Field label="Tipo de imóvel" placeholder="Apartamento, casa..." />
        <Field label="Bairro / localização" placeholder="Onde fica?" />
      </div>
      <label>
        <span className="mb-1 block text-[7px] uppercase tracking-[0.35em] text-navy">
          Observações
        </span>
        <textarea
          className="h-24 w-full resize-none border border-navy/15 bg-transparent px-3 py-2.5 text-[13px] text-navy outline-none placeholder:text-navy/35"
          placeholder="Conte mais sobre o imóvel..."
        />
      </label>
      <TerraButton label="Solicitar Avaliação Gratuita" />
    </form>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-1 block text-[7px] uppercase tracking-[0.35em] text-navy">
        {label}
      </span>
      <input
        className="w-full border-0 border-b border-navy/15 bg-transparent py-2.5 text-[13px] text-navy outline-none placeholder:text-navy/35"
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function NewsletterBlock() {
  return (
    <section className="site-container grid grid-cols-1 items-center gap-8 bg-terra py-12 md:grid-cols-2 md:gap-16 md:py-16">
      <div>
        <p className="mb-3.5 text-[8px] uppercase tracking-[0.45em] text-white/75">
          Newsletter
        </p>
        <h2 className="mb-3.5 text-[clamp(24px,6.5vw,38px)] font-light leading-tight tracking-[0.04em] text-white">
          O mercado premium
          <br />
          direto no seu e-mail
        </h2>
        <p className="max-w-[340px] text-xs leading-[1.9] text-white/75">
          Lançamentos exclusivos, análises de mercado e seleções da nossa
          curadoria — antes de todo mundo.
        </p>
      </div>
      <form className="flex flex-col gap-3">
        <p className="text-[11px] leading-[1.7] text-white/75">
          Sem spam. Conteúdo com real valor para quem vive ou investe em imóveis
          de alto padrão. Cancele a qualquer momento.
        </p>
        <div className="flex">
          <input
            className="min-w-0 flex-1 border border-r-0 border-white/25 bg-white/10 px-[18px] py-[13px] text-xs text-white outline-none placeholder:text-white/75"
            placeholder="seu@email.com"
            type="email"
          />
          <button
            className="bg-navy px-6 py-[13px] text-[9px] uppercase tracking-[0.28em] text-white transition hover:bg-[#1d2e42] md:px-[26px]"
            type="button"
          >
            Assinar
          </button>
        </div>
      </form>
    </section>
  );
}

export default async function Home() {
  const { featured, bairros, totals } = await getHomeData();
  const stats = [
    {
      value: "25",
      suffix: " anos",
      label: "de experiência no mercado imobiliário de Londrina",
    },
    {
      value: `${totals.total_imoveis}+`,
      suffix: "",
      label: "imóveis de alto padrão selecionados em carteira",
    },
    {
      value: String(totals.total_bairros),
      suffix: " bairros",
      label: "com presença ativa em Londrina",
    },
    {
      value: "R$ 2,4bi",
      suffix: "",
      label: "em transações nos últimos 5 anos",
    },
  ];

  return (
    <main className="bg-offwhite text-navy">
      <section className="relative h-screen overflow-hidden bg-[#1e1e1e]">
        <img
          alt="Piscina de borda infinita com vista ao pôr do sol — imóvel de alto padrão da Inglaterra Premium em Londrina"
          className="absolute inset-0 h-full w-full object-cover opacity-75"
          src="/images/capa-hero.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/30 via-navy/20 to-navy/75" />
        <div className="site-container absolute inset-x-0 top-[74px] flex items-center gap-3.5 md:top-[100px]">
          <div className="h-px w-6 shrink-0 bg-terra-light" />
          <span className="text-[8px] uppercase tracking-[0.3em] text-white/75 md:text-[9px]">
            Imóvel em destaque — Londrina, Paraná
          </span>
        </div>
        <div className="site-container absolute inset-x-0 bottom-6 md:bottom-[130px]">
          <h1 className="mb-2.5 max-w-full break-words text-[clamp(26px,9vw,34px)] font-light leading-[1.05] tracking-[0.02em] text-white md:mb-4 md:text-[clamp(34px,5.4vw,68px)]">
            Imóveis de alto padrão
            <br />
            em Londrina
          </h1>
          <p className="mb-5 text-[clamp(15px,4.4vw,18px)] font-light italic tracking-[0.02em] text-white/75 md:mb-9 md:text-[clamp(16px,1.8vw,22px)]">
            Onde visão se torna patrimônio.
          </p>
          <HeroSearch />
        </div>
        <div className="absolute bottom-12 right-16 hidden flex-col items-center gap-2 text-[8px] uppercase tracking-[0.35em] text-white/75 [writing-mode:vertical-rl] md:flex">
          Rolar
          <div className="mt-1 h-8 w-px bg-white/25" />
        </div>
      </section>

      <div className="hidden">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((item, index) => (
            <span
              className="pr-12 text-[8px] uppercase tracking-[0.38em] text-navy"
              key={`${item}-${index}`}
            >
              {item} ·
            </span>
          ))}
        </div>
      </div>

      <Rule label="Imóveis em Destaque" right={`${featured.length} selecionados`} />
      <section className="site-container py-12">
        <h2 className="sr-only">Imóveis de Alto Padrão à Venda em Londrina</h2>
        <div className="flex flex-col gap-[5px] md:hidden">
          {featured.map((property) => (
            <PropCard h="" key={property.id} p={property} />
          ))}
        </div>
        <div className="hidden md:block">
          <div className="mb-[5px] grid grid-cols-[7fr_5fr] gap-[5px]">
            {featured[0] ? <PropCard h="md:h-[600px]" p={featured[0]} /> : null}
            {featured[1] ? <PropCard h="md:h-[600px]" p={featured[1]} /> : null}
          </div>
          <div className="grid grid-cols-[5fr_7fr] gap-[5px]">
            {featured[2] ? <PropCard h="md:h-[500px]" p={featured[2]} /> : null}
            {featured[3] ? <PropCard h="md:h-[500px]" p={featured[3]} /> : null}
          </div>
        </div>
      </section>

      <Rule label="Explorar por Localização" />
      <section className="site-container py-14">
        <div className="mb-8 flex flex-col items-start justify-between gap-3.5 md:flex-row md:items-end md:gap-0">
          <h2 className="text-[clamp(24px,6vw,40px)] font-light leading-tight tracking-[0.04em]">
            Bairros de alto padrão
            <br />
            que a Inglaterra conhece bem
          </h2>
          <Anchor label="Ver todos os bairros" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4 md:gap-1">
          {bairros.slice(0, 4).map((bairro) => (
            <BairroCard b={bairro} key={bairro.name} />
          ))}
        </div>
      </section>

      <section className="site-container bg-navy py-12 md:py-20">
        <div className="mb-10 flex flex-col items-start justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end md:gap-0">
          <div>
            <div className="mb-4 flex items-center gap-3.5">
              <div className="h-px w-6 bg-terra-light" />
              <span className="text-[8px] uppercase tracking-[0.35em] text-terra-light">
                Nossos Produtos
              </span>
            </div>
            <h2 className="text-[clamp(26px,7vw,46px)] font-light leading-tight tracking-[0.04em] text-white">
              Compre pronto, alugue sob medida
              <br />
              <span className="text-white/75">ou entre antes de todo mundo</span>
            </h2>
          </div>
          <p className="max-w-[280px] text-xs leading-[1.9] text-white/75">
            Três caminhos para comprar, construir ou investir em Londrina —
            escolha o que faz sentido para você e sua família.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-[5px] md:grid-cols-3">
          {PRODUCTS.map((product) => (
            <ProdCard key={product.title} p={product} />
          ))}
        </div>
      </section>

      <section className="relative border-y border-navy/10 bg-offwhite">
        <h2 className="sr-only">A Inglaterra Premium em Números, em Londrina</h2>
        <div className="site-container grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              className="border-b border-r border-navy/10 px-[18px] py-7 text-center even:border-r-0 md:border-b-0 md:px-10 md:py-[52px] md:last:border-r-0"
              key={stat.label}
            >
              <p className="mb-2 text-[clamp(28px,7vw,54px)] font-light leading-none tracking-[0.02em]">
                {stat.value}
                <span className="text-[0.4em] text-terra">{stat.suffix}</span>
              </p>
              <p className="text-[11px] leading-[1.6] text-navy">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Rule label="Diretoria" />
      <section className="site-container py-16">
        <div className="mb-10 flex flex-col items-start justify-between gap-3.5 md:flex-row md:items-end md:gap-0">
          <h2 className="text-[clamp(24px,6vw,40px)] font-light leading-tight tracking-[0.04em]">
            As pessoas por trás
            <br />
            da Inglaterra Premium
          </h2>
          <p className="max-w-[280px] text-xs leading-[1.9] text-navy">
            Três décadas de mercado imobiliário de alto padrão concentradas em
            uma liderança que conhece cada detalhe.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-[5px]">
          {DIRECTORS.map((director) => (
            <DirCard d={director} key={director.name} />
          ))}
        </div>
      </section>

      <Rule label="Notícias & Mercado" />
      <section className="site-container bg-offwhite py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-3.5 md:flex-row md:items-end md:gap-0">
          <h2 className="text-[clamp(22px,5.5vw,38px)] font-light leading-tight tracking-[0.04em]">
            O mercado de alto padrão
            <br />
            de Londrina, em perspectiva
          </h2>
          <Anchor label="Ver todas as notícias" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-[5px]">
          {NEWS.map((news) => (
            <NewsCard key={news.title} n={news} />
          ))}
        </div>
      </section>

      <section className="relative min-h-[520px] overflow-hidden bg-[#1e1e1e]">
        <img
          alt="Corretor de imóveis de alto padrão"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src="/images/capa-hero.jpg"
        />
        <div className="site-container relative z-10 grid min-h-[520px] grid-cols-1 items-center gap-10 py-14 md:grid-cols-2 md:gap-20 md:py-20">
          <div>
            <div className="mb-5 flex items-center gap-3.5">
              <div className="h-px w-6 bg-terra-light" />
              <span className="text-[8px] uppercase tracking-[0.4em] text-terra-light">
                Carreiras
              </span>
            </div>
            <h2 className="mb-5 text-[clamp(26px,7vw,46px)] font-light leading-tight tracking-[0.04em] text-white">
              Seja um corretor
              <br />
              Inglaterra Premium
            </h2>
            <p className="mb-8 max-w-[360px] text-[13px] leading-[1.9] text-white/75">
              Trabalhe como corretor de imóveis de alto padrão em Londrina.
              Represente clientes exigentes com o suporte de uma marca
              consolidada há 25 anos na cidade.
            </p>
            <TerraButton label="Quero me candidatar" />
          </div>
          <div className="grid grid-cols-2 gap-5 md:gap-7">
            {DIFFS.map((diff) => (
              <div className="border-t border-white/10 pt-5" key={diff.num}>
                <p className="mb-2 text-[22px] font-light text-white/15 md:text-[28px]">
                  {diff.num}
                </p>
                <h3 className="mb-2 text-[13px] tracking-[0.03em] text-white md:text-[15px]">
                  {diff.title}
                </h3>
                <p className="text-[11px] leading-[1.7] text-white/75">
                  {diff.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Rule label="Para Proprietários" />
      <section className="site-container grid grid-cols-1 items-start gap-11 py-[72px] md:grid-cols-2 md:gap-20">
        <div>
          <div className="mb-5 flex items-center gap-3.5">
            <div className="h-px w-6 bg-terra" />
            <span className="text-[8px] uppercase tracking-[0.4em] text-terra">
              Captação de Imóveis
            </span>
          </div>
          <h2 className="mb-5 text-[clamp(24px,6.5vw,42px)] font-light leading-tight tracking-[0.04em]">
            Seu imóvel ainda não
            <br />
            está na Inglaterra?
          </h2>
          <p className="mb-7 max-w-[380px] text-[13px] leading-[1.9] text-navy">
            Apresente seu imóvel de alto padrão em Londrina à nossa equipe de
            curadoria. Avaliamos gratuitamente e conectamos seu patrimônio aos
            compradores certos — com discrição e eficiência.
          </p>
          {[
            "Avaliação gratuita e sem compromisso",
            "Divulgação segmentada ao público correto",
            "Acompanhamento jurídico completo",
            "Atendimento personalizado do início ao fim",
          ].map((item) => (
            <div className="mb-3 flex items-center gap-3" key={item}>
              <div className="h-1 w-1 shrink-0 bg-terra" />
              <span className="text-xs text-navy">{item}</span>
            </div>
          ))}
        </div>
        <CaptureForm />
      </section>

      <section className="site-container border-t border-navy/10 bg-offwhite py-14">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end md:gap-0">
          <div>
            <p className="mb-1.5 text-[8px] uppercase tracking-[0.4em] text-navy">
              Siga no Instagram
            </p>
            <h2 className="text-xl tracking-[0.06em] md:text-[26px]">
              @inglaterrapremium
            </h2>
          </div>
          <a
            className="border-b border-terra pb-0.5 text-[9px] uppercase tracking-[0.3em] text-terra"
            href="https://instagram.com"
            rel="noreferrer"
            target="_blank"
          >
            Abrir Instagram
          </a>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-[3px]">
          {[
            "/images/capa-hero.jpg",
            "/images/capa-hero.jpg",
            "/images/capa-hero.jpg",
          ].map((url, index) => (
            <div
              className="group relative aspect-square cursor-pointer overflow-hidden bg-[#c8bdb6]"
              key={url}
            >
              <img
                alt={`Publicação ${index + 1} do Instagram da Inglaterra Premium`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                src={url}
              />
              <div className="absolute inset-0 hidden items-center justify-center bg-navy/45 group-hover:flex">
                <span className="text-lg text-white">♡</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <NewsletterBlock />
    </main>
  );
}
