import { useState, useEffect } from 'react'
import perspectiva from '@/imports/capa-hero.jpg'
import logoNavy from '@/imports/logo-navy.png'
import logoWhite from '@/imports/logo-white.png'
import diretorWagner from '@/imports/diretor-wagner.jpg'
import diretorLuis from '@/imports/diretor-luis.jpg'
import diretorVanderson from '@/imports/diretor-vanderson.jpg'

// ─── Responsive helper ─────────────────────────────────────
// O layout original era só desktop (padding e grid-columns fixos).
// Este hook dá a cada componente um booleano `isMobile` para trocar
// padding, número de colunas e comportamento de hover -> sempre visível.
function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

// ─── Brand tokens ──────────────────────────────────────────
const B = {
  navy:      '#101a26',   // Pantone 532 C
  terra:     '#51210d',   // Pantone 7610 C
  terraLight:'#d98a4e',   // tom claro da terracota — só para texto/detalhes sobre fundo escuro (terra puro tem contraste ~1.3:1 em navy, insuficiente para leitura)
  sand:      '#998376',   // Pantone 2471 C
  dark:      '#1e1e1e',   // Pantone 426 C
  white:     '#ffffff',
  offwhite:  '#F5F3F0',
  navyMid:   'rgba(16,26,38,0.08)',
  serif:     "'DM Sans', system-ui, sans-serif", // manual de marca: só DM Sans em todo o conteúdo — a fonte exclusiva é restrita ao logotipo
  sans:      "'DM Sans', system-ui, sans-serif",
}

// ─── Logo SVG (geometric skyline symbol) ──────────────────
function LogoFull({ dark = true }: { dark?: boolean }) {
  return (
    <img
      src={dark ? logoNavy : logoWhite}
      alt="Inglaterra Premium"
      style={{ height: 44, width: 'auto', display: 'block' }}
    />
  )
}

function LogoHorizontal({ dark = true }: { dark?: boolean }) {
  return (
    <img
      src={dark ? logoNavy : logoWhite}
      alt="Inglaterra Premium"
      style={{ height: 34, width: 'auto', display: 'block' }}
    />
  )
}

// Textos revisados para SEO/AEO/GEO: localização real (Londrina) em cada item,
// frases declarativas e específicas (fáceis de citar por buscadores e IA),
// sem números/localizações fictícias fora da área de atuação real da empresa.
const FEATURED = [
  { id: '01', title: 'Imperial Mall Bélgica', location: 'Gleba Palhano, Londrina', area: '12.400 m²', bedrooms: 0, price: 'Sob consulta', tag: 'LANÇAMENTO', image: perspectiva as string, isLocal: true },
  { id: '02', title: 'Penthouse Lago Igapó', location: 'Bela Suíça, Londrina', area: '540 m²', bedrooms: 4, price: 'R$ 6.800.000', tag: 'EXCLUSIVO', image: 'https://picsum.photos/seed/inglaterra1/900/1100', isLocal: false },
  { id: '03', title: 'Villa Country Club', location: 'Country Club, Londrina', area: '620 m²', bedrooms: 5, price: 'R$ 8.500.000', tag: 'NOVO', image: 'https://picsum.photos/seed/inglaterra2/900/800', isLocal: false },
  { id: '04', title: 'Cobertura Terra Bonita', location: 'Terra Bonita, Londrina', area: '480 m²', bedrooms: 4, price: 'R$ 4.250.000', tag: 'DESTAQUE', image: 'https://picsum.photos/seed/inglaterra3/900/800', isLocal: false },
]

const BAIRROS = [
  { name: 'Gleba Palhano', cidade: 'Londrina', imoveis: 38, image: 'https://picsum.photos/seed/inglaterra4/600/800' },
  { name: 'Terra Bonita', cidade: 'Londrina', imoveis: 24, image: 'https://picsum.photos/seed/inglaterra5/600/800' },
  { name: 'Bela Suíça', cidade: 'Londrina', imoveis: 44, image: 'https://picsum.photos/seed/inglaterra6/600/800' },
  { name: 'Country Club', cidade: 'Londrina', imoveis: 21, image: 'https://picsum.photos/seed/inglaterra7/600/800' },
  { name: 'Aeroporto', cidade: 'Londrina', imoveis: 29, image: 'https://picsum.photos/seed/inglaterra8/600/800' },
  { name: 'Km 0', cidade: 'Londrina', imoveis: 15, image: 'https://picsum.photos/seed/inglaterra9/600/800' },
]
// No mobile mostramos só 3 bairros por vez (evita grid apertada) — os 3 mais
// representativos ficam nas primeiras posições do array acima.
const BAIRROS_MOBILE_COUNT = 3
const BAIRROS_DESKTOP_COUNT = 4


const PRODUCTS = [
  { title: 'Imóveis em Condomínios', desc: 'Casas e apartamentos à venda em condomínios fechados de alto padrão em Londrina, com segurança 24h e localização privilegiada nos bairros mais valorizados da cidade.', cta: 'Ver Condomínios', label: 'CONDOMÍNIOS', image: 'https://picsum.photos/seed/inglaterra10/900/1100' },
  { title: 'Inglaterra BTS', desc: 'Built to Suit corporativo em Londrina — imóveis projetados e construídos sob medida para a operação da sua empresa, com contrato de locação de longo prazo.', cta: 'Conheça o BTS', label: 'BTS', image: 'https://picsum.photos/seed/inglaterra11/900/1100' },
  { title: 'Lançamentos', desc: 'Acesso antecipado a lançamentos imobiliários de alto padrão em Londrina, antes da divulgação ao mercado, com condições exclusivas de pré-lançamento.', cta: 'Ver Lançamentos', label: 'LANÇAMENTOS', image: 'https://picsum.photos/seed/inglaterra12/900/1100' },
]

const STATS = [
  { value: '25', suffix: ' anos', label: 'de experiência no mercado imobiliário de Londrina' },
  { value: '180+', suffix: '', label: 'imóveis de alto padrão selecionados em carteira' },
  { value: '12', suffix: ' bairros', label: 'com presença ativa em Londrina' },
  { value: 'R$ 2,4bi', suffix: '', label: 'em transações nos últimos 5 anos' },
]

const DIRECTORS = [
  { name: 'Wagner Lopes Redon', title: 'Diretor de Locação', quote: '"Comecei no mercado imobiliário ainda jovem, acompanhando meu pai em visitas a imóveis aos sábados, e nunca mais quis fazer outra coisa. Para mim, a essência da Inglaterra Premium está em cuidar de cada imóvel administrado como se fosse o nosso próprio patrimônio."', image: diretorWagner },
  { name: 'Luis Carlos Itakura', title: 'Diretor Administrativo', quote: '"Vim de uma trajetória em gestão e finanças, e encontrei na Inglaterra Premium o desafio de dar estrutura a um mercado que exige precisão em cada detalhe. A essência da marca, pra mim, é a solidez que sustenta, nos bastidores, a confiança que o cliente sente na hora da venda."', image: diretorLuis },
  { name: 'Vanderson Lopes Redon', title: 'Diretor de Vendas', quote: '"Entrei para o mercado imobiliário ao perceber que minha vocação sempre foi entender pessoas antes de entender imóveis. A essência da Inglaterra Premium, na minha visão, é nunca vender um imóvel sem antes entender o que aquele cliente realmente está construindo."', image: diretorVanderson },
]

const NEWS = [
  { cat: 'Mercado', date: '08 Ago 2026', title: 'Alto padrão registra recorde de valorização em Londrina no 1º semestre', excerpt: 'Imóveis de luxo em Londrina lideraram a valorização imobiliária da cidade, com alta de até 18% em 12 meses nos bairros Gleba Palhano e Bela Suíça, segundo levantamento da Inglaterra Premium.', image: 'https://picsum.photos/seed/inglaterra16/800/500' },
  { cat: 'Tendências', date: '01 Ago 2026', title: 'Build to Suit: a nova fronteira para quem não abre mão da exclusividade', excerpt: 'Clientes de alta renda de Londrina migram para imóveis 100% personalizados. Entenda como funciona o modelo Build to Suit da Inglaterra Premium, do terreno ao projeto pronto.', image: 'https://picsum.photos/seed/inglaterra17/800/500' },
  { cat: 'Legislação', date: '24 Jul 2026', title: 'Novas regras para condomínios de luxo: o que muda em 2026', excerpt: 'As alterações aprovadas no código civil afetam cláusulas de convenção em empreendimentos verticais de alto padrão em todo o Brasil, incluindo os condomínios de Londrina.', image: 'https://picsum.photos/seed/inglaterra18/800/500' },
]

const DIFFS = [
  { num: '01', title: 'Marca Premium', text: '25 anos construindo uma das imobiliárias de alto padrão mais respeitadas de Londrina, com reconhecimento em todo o Paraná.' },
  { num: '02', title: 'Carteira Qualificada', text: 'Portfólio com mais de 180 imóveis de alto padrão selecionados e clientes com real poder de compra.' },
  { num: '03', title: 'Suporte Completo', text: 'Treinamentos, CRM dedicado, apoio jurídico e marketing profissional para cada corretor.' },
  { num: '04', title: 'Remuneração Atrativa', text: 'Comissionamento competitivo com bonificações por desempenho e carteira fidelizada.' },
]

const IG_IMGS = [
  perspectiva as string,
  'https://picsum.photos/seed/inglaterra19/400/400',
  'https://picsum.photos/seed/inglaterra20/400/400',
  'https://picsum.photos/seed/inglaterra21/400/400',
  'https://picsum.photos/seed/inglaterra22/400/400',
  'https://picsum.photos/seed/inglaterra23/400/400',
  'https://picsum.photos/seed/inglaterra24/400/400',
  'https://picsum.photos/seed/inglaterra25/400/400',
  'https://picsum.photos/seed/inglaterra26/400/400',
]

const TICKER = ['Londrina', 'Gleba Palhano', 'Terra Bonita', 'Bela Suíça', 'Country Club', 'Aeroporto', 'Km 0', 'Condomínios de Alto Padrão', 'Residenciais de Luxo']

// ─── Helpers ───────────────────────────────────────────────
function Rule({ label, right }: { label?: string; right?: string }) {
  const isMobile = useIsMobile()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: `16px ${isMobile ? 20 : 64}px`, borderTop: `1px solid ${B.navyMid}`, borderBottom: `1px solid ${B.navyMid}` }}>
      {label && <span style={{ fontSize: 8, letterSpacing: isMobile ? '0.2em' : '0.4em', textTransform: 'uppercase' as const, color: B.sand, whiteSpace: 'nowrap' as const, fontFamily: B.sans, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, backgroundColor: B.navyMid }} />
      {right && <span style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: B.sand, whiteSpace: 'nowrap' as const, fontFamily: B.sans }}>{right}</span>}
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState('Comprar')
  const [navOpen, setNavOpen] = useState(false)
  const isMobile = useIsMobile()
  const sidePad = isMobile ? 20 : 64
  const NAV_ITEMS = ['Comprar', 'Alugar', 'Lançamentos', 'Condomínios', 'BTS', 'Sobre']

  return (
    <div style={{ backgroundColor: B.offwhite, color: B.navy, fontFamily: B.sans }}>

      {/* ── NAV ───────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `14px ${sidePad}px`,
        backgroundColor: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${B.navyMid}`,
      }}>
        <div style={{ transform: isMobile ? 'scale(0.85)' : 'none', transformOrigin: 'left center' }}>
          <LogoHorizontal dark />
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {NAV_ITEMS.map(item => (
              <button key={item} onClick={() => setActiveNav(item)} style={{
                fontSize: 11, letterSpacing: '0.08em',
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeNav === item ? B.terra : B.navy,
                opacity: activeNav === item ? 1 : 0.5,
                fontFamily: B.sans, fontWeight: 400,
                transition: 'all 0.2s',
                borderBottom: activeNav === item ? `1px solid ${B.terra}` : '1px solid transparent',
                paddingBottom: 2,
              }}>{item}</button>
            ))}
          </div>
        )}

        {isMobile ? (
          <button aria-label="Abrir menu" onClick={() => setNavOpen(v => !v)} style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5,
            width: 26, height: 26, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            <span style={{ display: 'block', height: 1, background: B.navy, width: '100%', transition: 'transform 0.25s ease, opacity 0.25s ease', transform: navOpen ? 'translateY(6px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', height: 1, background: B.navy, width: '100%', opacity: navOpen ? 0 : 1, transition: 'opacity 0.25s ease' }} />
            <span style={{ display: 'block', height: 1, background: B.navy, width: '100%', transition: 'transform 0.25s ease', transform: navOpen ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
          </button>
        ) : (
          <NavBtn label="Contato" />
        )}
      </nav>

      {/* ── MOBILE NAV DRAWER ─────────────────────────────── */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 54, left: 0, right: 0, zIndex: 49,
          backgroundColor: B.offwhite, borderBottom: `1px solid ${B.navyMid}`,
          maxHeight: navOpen ? 480 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease',
        }}>
          {NAV_ITEMS.map(item => (
            <button key={item} onClick={() => { setActiveNav(item); setNavOpen(false) }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '16px 20px', fontSize: 13, letterSpacing: '0.06em',
              background: 'none', border: 'none', borderBottom: `1px solid ${B.navyMid}`, cursor: 'pointer',
              color: activeNav === item ? B.terra : B.navy, fontFamily: B.sans,
            }}>{item}</button>
          ))}
          <div style={{ padding: 20 }}><NavBtn label="Contato" /></div>
        </div>
      )}

      {/* ── §1 HERO + BUSCA ───────────────────────────────── */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', backgroundColor: B.dark }}>
        <img
          src={perspectiva}
          alt="Piscina de borda infinita com vista ao pôr do sol — imóvel de alto padrão da Inglaterra Premium em Londrina"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
        />
        {/* Gradient overlay — heavier at bottom for legibility */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(16,26,38,0.3) 0%, rgba(16,26,38,0.2) 50%, rgba(16,26,38,0.75) 100%)` }} />

        {/* Top editorial label */}
        <div style={{ position: 'absolute', top: isMobile ? 74 : 100, left: sidePad, right: sidePad, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 24, height: 1, backgroundColor: B.terraLight, flexShrink: 0 }} />
          <span style={{ fontSize: isMobile ? 8 : 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontFamily: B.sans }}>
            {isMobile ? 'Destaque — Londrina, PR' : 'Imóvel em destaque — Londrina, Paraná'}
          </span>
        </div>

        {/* Headline */}
        <div style={{ position: 'absolute', bottom: isMobile ? 24 : 130, left: sidePad, right: sidePad }}>
          <h1 style={{
            fontFamily: B.serif,
            fontSize: isMobile ? 'clamp(26px, 9vw, 34px)' : 'clamp(34px, 5.4vw, 68px)',
            fontWeight: 300, lineHeight: 1.05,
            color: B.white, marginBottom: isMobile ? 10 : 16,
            letterSpacing: '0.02em',
            overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '100%',
          }}>
            Imóveis de alto padrão<br />em Londrina
          </h1>
          <p style={{
            fontFamily: B.serif, fontStyle: 'italic',
            fontSize: isMobile ? 'clamp(15px, 4.4vw, 18px)' : 'clamp(16px, 1.8vw, 22px)',
            color: 'rgba(255,255,255,0.55)', fontWeight: 300,
            marginBottom: isMobile ? 20 : 36, letterSpacing: '0.02em',
          }}>
            Onde visão se torna patrimônio.
          </p>
          <HeroSearch />
        </div>

        {/* Scroll cue */}
        {!isMobile && (
          <div style={{
            position: 'absolute', bottom: 48, right: 64,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            color: 'rgba(255,255,255,0.35)', fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase',
            fontFamily: B.sans, writingMode: 'vertical-rl',
          }}>
            Rolar <div style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 4 }} />
          </div>
        )}
      </section>

      {/* ── TICKER ────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${B.navyMid}`, borderBottom: `1px solid ${B.navyMid}`, padding: '11px 0', overflow: 'hidden', backgroundColor: B.offwhite }}>
        <div className="animate-marquee" style={{ display: 'flex', whiteSpace: 'nowrap' }}>
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((c, i) => (
            <span key={i} style={{ fontSize: 8, letterSpacing: '0.38em', textTransform: 'uppercase', color: B.sand, paddingRight: 48, fontFamily: B.sans }}>{c} ·</span>
          ))}
        </div>
      </div>

      {/* ── §2 IMÓVEIS EM DESTAQUE ────────────────────────── */}
      <Rule label="Imóveis em Destaque" right={`${FEATURED.length} selecionados`} />
      <section style={{ padding: `48px ${sidePad}px` }}>
        <h2 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', whiteSpace: 'nowrap', border: 0 }}>
          Imóveis de Alto Padrão à Venda em Londrina
        </h2>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {FEATURED.map(p => <PropCard key={p.id} p={p} h={340} />)}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 5, marginBottom: 5 }}>
              <PropCard p={FEATURED[0]} h={600} />
              <PropCard p={FEATURED[1]} h={600} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 5 }}>
              <PropCard p={FEATURED[2]} h={500} />
              <PropCard p={FEATURED[3]} h={500} />
            </div>
          </>
        )}
      </section>

      {/* ── §3 BAIRROS ────────────────────────────────────── */}
      <Rule label="Explorar por Localização" />
      <section style={{ padding: `56px ${sidePad}px` }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 0, justifyContent: 'space-between', marginBottom: 32 }}>
          <h2 style={{ fontFamily: B.serif, fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 300, letterSpacing: '0.04em', lineHeight: 1.1 }}>
            Bairros de alto padrão<br />que a Inglaterra conhece bem
          </h2>
          <Anchor label="Ver todos os bairros" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 6 : 4 }}>
          {(isMobile ? BAIRROS.slice(0, BAIRROS_MOBILE_COUNT) : BAIRROS.slice(0, BAIRROS_DESKTOP_COUNT)).map(b => <BairroCard key={b.name} b={b} />)}
        </div>
      </section>

      {/* ── §4 PRODUTOS INGLATERRA PREMIUM ────────────────── */}
      <section style={{ backgroundColor: B.navy, padding: isMobile ? '48px 20px' : '80px 64px' }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 20 : 0, justifyContent: 'space-between', paddingBottom: 32, marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 24, height: 1, backgroundColor: B.terraLight, flexShrink: 0 }} />
              <span style={{ fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: B.terraLight, fontFamily: B.sans }}>Nossos Produtos</span>
            </div>
            <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: 'clamp(26px, 7vw, 46px)', color: B.white, lineHeight: 1.1, letterSpacing: '0.04em' }}>
              Compre pronto, alugue sob medida<br /><span style={{ color: 'rgba(255,255,255,0.35)' }}>ou entre antes de todo mundo</span>
            </h2>
          </div>
          <p style={{ maxWidth: 280, fontSize: 12, lineHeight: 1.9, color: 'rgba(255,255,255,0.4)', fontFamily: B.sans }}>
            Três caminhos para comprar, construir ou investir em Londrina — escolha o que faz sentido para você e sua família.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 5 }}>
          {PRODUCTS.map(p => <ProdCard key={p.title} p={p} />)}
        </div>
      </section>

      {/* ── §5 ESTATÍSTICAS ───────────────────────────────── */}
      <section style={{ backgroundColor: B.offwhite, borderTop: `1px solid ${B.navyMid}`, borderBottom: `1px solid ${B.navyMid}`, position: 'relative' }}>
        <h2 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', whiteSpace: 'nowrap', border: 0 }}>
          A Inglaterra Premium em Números, em Londrina
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
          {STATS.map((s, i) => {
            const cols = isMobile ? 2 : 4
            const isRightEdge = (i + 1) % cols === 0
            const isLastRow = i >= STATS.length - (STATS.length % cols || cols)
            return (
              <div key={s.label} style={{
                padding: isMobile ? '28px 18px' : '52px 40px', textAlign: 'center',
                borderRight: isRightEdge ? 'none' : `1px solid ${B.navyMid}`,
                borderBottom: isMobile && !isLastRow ? `1px solid ${B.navyMid}` : 'none',
              }}>
                <p style={{ fontFamily: B.serif, fontWeight: 300, fontSize: 'clamp(28px, 7vw, 54px)', letterSpacing: '0.02em', lineHeight: 1, marginBottom: 8, color: B.navy }}>
                  {s.value}<span style={{ fontSize: '0.4em', color: B.terra }}>{s.suffix}</span>
                </p>
                <p style={{ fontSize: 11, color: B.sand, lineHeight: 1.6, fontFamily: B.sans }}>{s.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── §6 DIRETORIA ──────────────────────────────────── */}
      <Rule label="Diretoria" />
      <section style={{ padding: `64px ${sidePad}px` }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 0, justifyContent: 'space-between', marginBottom: 40 }}>
          <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: 'clamp(24px, 6vw, 40px)', letterSpacing: '0.04em', lineHeight: 1.1 }}>
            As pessoas por trás<br />da Inglaterra Premium
          </h2>
          <p style={{ maxWidth: 280, fontSize: 12, lineHeight: 1.9, color: B.sand, fontFamily: B.sans }}>
            Três décadas de mercado imobiliário de alto padrão concentradas em uma liderança que conhece cada detalhe.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 24 : 5 }}>
          {DIRECTORS.map(d => <DirCard key={d.name} d={d} />)}
        </div>
      </section>

      {/* ── §7 NOTÍCIAS ───────────────────────────────────── */}
      <Rule label="Notícias & Mercado" />
      <section style={{ padding: `64px ${sidePad}px`, backgroundColor: B.offwhite }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 0, justifyContent: 'space-between', marginBottom: 32 }}>
          <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: 'clamp(22px, 5.5vw, 38px)', letterSpacing: '0.04em', lineHeight: 1.1 }}>
            O mercado de alto padrão<br />de Londrina, em perspectiva
          </h2>
          <Anchor label="Ver todas as notícias" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 24 : 5 }}>
          {NEWS.map(n => <NewsCard key={n.title} n={n} />)}
        </div>
      </section>

      {/* ── §8 SEJA UM CORRETOR ───────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 520, backgroundColor: B.dark }}>
        <img src="https://picsum.photos/seed/inglaterra27/1600/800"
          alt="Corretor de imóveis de alto padrão"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
        <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80, padding: isMobile ? '56px 20px' : '80px 64px', minHeight: isMobile ? 'auto' : 520, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 24, height: 1, backgroundColor: B.terraLight, flexShrink: 0 }} />
              <span style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: B.terraLight, fontFamily: B.sans }}>Carreiras</span>
            </div>
            <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: 'clamp(26px, 7vw, 46px)', color: B.white, lineHeight: 1.1, letterSpacing: '0.04em', marginBottom: 20 }}>
              Seja um corretor<br />Inglaterra Premium
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.9, marginBottom: 32, maxWidth: 360, fontFamily: B.sans }}>
              Trabalhe como corretor de imóveis de alto padrão em Londrina. Represente clientes exigentes com o suporte de uma marca consolidada há 25 anos na cidade.
            </p>
            <TerraBtn label="Quero me candidatar" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? 20 : 28 }}>
            {DIFFS.map(d => (
              <div key={d.num} style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontFamily: B.serif, fontSize: isMobile ? 22 : 28, color: 'rgba(255,255,255,0.15)', marginBottom: 8 }}>{d.num}</p>
                <h4 style={{ fontFamily: B.serif, fontSize: isMobile ? 13 : 15, color: B.white, marginBottom: 8, letterSpacing: '0.03em' }}>{d.title}</h4>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontFamily: B.sans }}>{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── §9 CAPTAÇÃO PROPRIETÁRIOS ─────────────────────── */}
      <Rule label="Para Proprietários" />
      <section style={{ padding: `72px ${sidePad}px`, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 44 : 80, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, backgroundColor: B.terra, flexShrink: 0 }} />
            <span style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans }}>Captação de Imóveis</span>
          </div>
          <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: 'clamp(24px, 6.5vw, 42px)', lineHeight: 1.1, letterSpacing: '0.04em', marginBottom: 20 }}>
            Seu imóvel ainda não<br />está na Inglaterra?
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.9, color: B.sand, marginBottom: 28, maxWidth: 380, fontFamily: B.sans }}>
            Apresente seu imóvel de alto padrão em Londrina à nossa equipe de curadoria. Avaliamos gratuitamente e conectamos seu patrimônio aos compradores certos — com discrição e eficiência.
          </p>
          {['Avaliação gratuita e sem compromisso', 'Divulgação segmentada ao público correto', 'Acompanhamento jurídico completo', 'Atendimento personalizado do início ao fim'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 4, height: 4, backgroundColor: B.terra, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: B.navy, fontFamily: B.sans }}>{item}</span>
            </div>
          ))}
        </div>
        <CaptForm />
      </section>

      {/* ── §10 INSTAGRAM ─────────────────────────────────── */}
      <section style={{ backgroundColor: B.offwhite, borderTop: `1px solid ${B.navyMid}`, padding: `56px ${sidePad}px` }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0, justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: B.sand, marginBottom: 6, fontFamily: B.sans }}>Siga no Instagram</p>
            <h2 style={{ fontFamily: B.serif, fontWeight: 400, fontSize: isMobile ? 20 : 26, letterSpacing: '0.06em' }}>@inglaterrapremium</h2>
          </div>
          <a href="https://instagram.com" target="_blank" rel="noreferrer"
            style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: B.terra, textDecoration: 'none', borderBottom: `1px solid ${B.terra}`, paddingBottom: 2, fontFamily: B.sans }}>
            Abrir Instagram
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 8 : 3 }}>
          {IG_IMGS.slice(0, 3).map((url, i) => <IgPost key={i} url={url} i={i} />)}
        </div>
      </section>

      {/* ── §11 NEWSLETTER ────────────────────────────────── */}
      <NewsletterBlock />

      {/* ── §12 FOOTER ────────────────────────────────────── */}
      <footer style={{ backgroundColor: B.navy, color: B.white, padding: isMobile ? '48px 20px 24px' : '64px 64px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr 1fr', gap: isMobile ? 36 : 48, marginBottom: isMobile ? 36 : 52 }}>
          <div>
            <div style={{ marginBottom: 24 }}>
              <LogoFull dark={false} />
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.9, color: 'rgba(255,255,255,0.35)', maxWidth: 220, fontFamily: B.sans }}>
              Imóveis de alto padrão com curadoria e excelência há 25 anos em Londrina e região.
            </p>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: B.sans }}>CRECI-PR 12.345</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: B.sans }}>(43) 3322-7575</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: B.sans }}>contato@inglaterrapremium.com.br</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: B.sans }}>Av. Duque de Caxias, 1726 · Londrina, PR</p>
            </div>
          </div>
          {[
            { title: 'Comprar', links: ['Apartamentos', 'Casas', 'Coberturas', 'Terrenos'] },
            { title: 'Produtos', links: ['Condomínios', 'Inglaterra BTS', 'Lançamentos'] },
            { title: 'Empresa', links: ['Sobre Nós', 'Diretoria', 'Seja Corretor', 'Imprensa'] },
            { title: 'Conteúdo', links: ['Notícias', 'Bairros', 'Newsletter', 'Instagram'] },
          ].map(col => (
            <div key={col.title}>
              <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: B.sand, marginBottom: 18, fontFamily: B.sans, fontWeight: 500 }}>{col.title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontFamily: B.sans, transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = B.white }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.3)' }}>
                    {l}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Terra accent bar */}
        <div style={{ height: 3, backgroundColor: B.terra, marginBottom: 20 }} />
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center' }}>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: B.sans }}>© 2026 Inglaterra Premium · Todos os direitos reservados</p>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: B.sans }}>Política de Privacidade · Termos de Uso</p>
        </div>
      </footer>
    </div>
  )
}

// ─── Components ────────────────────────────────────────────

function NavBtn({ label }: { label: string }) {
  const [h, setH] = useState(false)
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
      border: `1px solid ${h ? B.terra : 'rgba(16,26,38,0.3)'}`,
      backgroundColor: h ? B.terra : 'transparent',
      color: h ? B.white : B.navy,
      padding: '9px 20px', cursor: 'pointer', fontFamily: B.sans, transition: 'all 0.25s',
    }}>{label}</button>
  )
}

function TerraBtn({ label }: { label: string }) {
  const [h, setH] = useState(false)
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase',
      backgroundColor: h ? '#6b2a0f' : B.terra,
      border: 'none', color: B.white,
      padding: '13px 30px', cursor: 'pointer', fontFamily: B.sans, transition: 'background-color 0.2s',
    }}>{label}</button>
  )
}

function Anchor({ label }: { label: string }) {
  return (
    <a href="#" style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: B.terra, textDecoration: 'none', borderBottom: `1px solid ${B.terra}`, paddingBottom: 2, fontFamily: B.sans }}>
      {label}
    </a>
  )
}

// Mesma lógica de interpretação usada na página de Busca — aqui reduzida
// ao essencial (bairro, tipo, suítes, valor) para caber no hero. No site
// real (Codex/Next.js) as duas telas chamam a mesma função/serviço de IA.
function interpretarBuscaHero(texto: string) {
  const lower = texto.toLowerCase()
  const bairro = BAIRROS.map(b => b.name).find(b => lower.includes(b.toLowerCase())) || null
  const tipo = ['Apartamento', 'Casa', 'Cobertura', 'Terreno'].find(t => lower.includes(t.toLowerCase())) || null
  const suiteMatch = lower.match(/(\d+)\s*su[íi]tes?/) || lower.match(/(\d+)\s*quartos?/)
  const suites = suiteMatch ? suiteMatch[1] : null
  const priceMatch = lower.match(/(?:at[ée]|menos de)\s*r?\$?\s*([\d.,]+)\s*(milh[ãa]o|milh[õo]es|mil)?/)
  let priceMax: number | null = null
  if (priceMatch) {
    let num = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'))
    const unit = priceMatch[2]
    if (unit && unit.startsWith('milh')) num *= 1_000_000
    else if (unit === 'mil') num *= 1_000
    priceMax = num
  }
  return { bairro, tipo, suites, priceMax }
}

function HeroSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [matchCount, setMatchCount] = useState<number | null>(null)
  const isMobile = useIsMobile()

  function buscar(texto: string) {
    if (!texto.trim()) return
    setQuery(texto)
    setLoading(true)
    setResponse(null)
    setTimeout(() => {
      const { bairro, tipo, suites, priceMax } = interpretarBuscaHero(texto)
      const algumCriterio = Boolean(bairro || tipo || suites || priceMax)
      // contagem simulada só para o protótipo — no site real vem da busca de fato no banco
      const estimativa = algumCriterio ? Math.max(1, Math.floor(Math.random() * 6) + 1) : FEATURED.length
      setMatchCount(estimativa)
      if (!algumCriterio) {
        setResponse(`Não identifiquei critérios específicos em "${texto}" — aqui estão os imóveis em destaque em Londrina.`)
      } else {
        const partes: string[] = []
        partes.push(tipo ? tipo.toLowerCase() : 'imóveis')
        if (bairro) partes.push(`em ${bairro}`)
        if (suites) partes.push(`com ${suites}+ suítes`)
        if (priceMax) partes.push(`até R$ ${priceMax.toLocaleString('pt-BR')}`)
        setResponse(`Encontrei ${estimativa} ${partes.join(' ')} em Londrina.`)
      }
      setLoading(false)
    }, 700)
  }

  const exemplos = ['Apartamento na Gleba Palhano até R$ 3 milhões', 'Casa com 4 suítes no Country Club']

  return (
    <div style={{
      width: '100%', maxWidth: isMobile ? '100%' : '54vw',
      backgroundColor: 'rgba(245,243,240,0.88)',
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,255,255,0.5)',
      padding: isMobile ? '22px 20px' : '32px 40px',
      boxShadow: '0 20px 48px rgba(16,26,38,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: B.terra, flexShrink: 0 }} />
        <span style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600 }}>
          Busca inteligente · Inglaterra AI
        </span>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); buscar(query) }}
        style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0, borderBottom: `1px solid ${B.navyMid}`, paddingBottom: isMobile ? 12 : 0 }}
      >
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Descreva o imóvel que você procura…'
          style={{
            flex: 1, border: 'none', background: 'none', outline: 'none',
            fontFamily: B.serif, fontStyle: 'italic', fontSize: isMobile ? 15 : 19,
            color: B.navy, padding: isMobile ? '4px 0' : '10px 0',
          }}
        />
        <button type="submit" disabled={loading} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: B.sans,
          fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.terra,
          padding: isMobile ? '4px 0' : '10px 0 10px 20px', textAlign: isMobile ? 'left' : 'right',
          opacity: loading ? 0.5 : 1, fontWeight: 600,
        }}>{loading ? 'Analisando…' : 'Perguntar →'}</button>
      </form>

      {!response && !loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {exemplos.map(ex => (
            <button key={ex} onClick={() => buscar(ex)} style={{
              fontSize: 10.5, padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: B.sans,
              border: `1px solid ${B.navyMid}`, backgroundColor: 'transparent', color: B.sand,
            }}>{ex}</button>
          ))}
        </div>
      )}

      {(loading || response) && (
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600 }}>IA</span>
            <p style={{ fontSize: 13.5, color: B.navy, lineHeight: 1.6, fontFamily: B.sans, margin: '4px 0 0' }}>
              {loading ? 'Analisando sua busca…' : response}
            </p>
          </div>
          {!loading && matchCount !== null && (
            // No site real, este botão leva para /imoveis já com os filtros aplicados.
            <a href="#" style={{
              flexShrink: 0, backgroundColor: B.terra, color: B.white, textDecoration: 'none',
              fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: B.sans,
              padding: '11px 20px', whiteSpace: 'nowrap',
            }}>Ver imóveis →</a>
          )}
        </div>
      )}
    </div>
  )
}

function PropCard({ p, h }: { p: (typeof FEATURED)[0]; h: number }) {
  const [hov, setHov] = useState(false)
  const isMobile = useIsMobile()
  const show = hov || isMobile // conteúdo extra sempre visível em touch, já que não existe hover no celular
  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: h, backgroundColor: B.dark, cursor: 'pointer' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <img src={p.image} alt={`${p.title} — ${p.location}`} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        opacity: hov ? 0.7 : 0.82, transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.8s ease',
      }} />
      {/* Navy overlay bottom */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(16,26,38,0.88) 0%, transparent 55%)' }} />

      <div style={{ position: 'absolute', top: 20, left: 22, right: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontFamily: B.serif, fontSize: 32, color: 'rgba(255,255,255,0.22)', lineHeight: 1 }}>{p.id}</span>
        <span style={{ fontSize: 8, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.25)', padding: '5px 10px', fontFamily: B.sans }}>{p.tag}</span>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px 22px 22px' }}>
        <p style={{ fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: B.sand, marginBottom: 8, fontFamily: B.sans }}>{p.location}</p>
        <h3 style={{ fontFamily: B.serif, fontSize: 20, color: B.white, lineHeight: 1.2, marginBottom: 0, letterSpacing: '0.03em' }}>{p.title}</h3>
        <div style={{ overflow: 'hidden', maxHeight: show ? 56 : 0, opacity: show ? 1 : 0, transition: 'all 0.5s ease' }}>
          <div style={{ display: 'flex', gap: 14, paddingTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: B.sans }}>
            <span>{p.area}</span>{p.bedrooms > 0 && <><span style={{ opacity: 0.4 }}>·</span><span>{p.bedrooms} quartos</span></>}<span style={{ opacity: 0.4 }}>·</span><span>{p.price}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BairroCard({ b }: { b: (typeof BAIRROS)[0] }) {
  const [hov, setHov] = useState(false)
  const isMobile = useIsMobile()
  const show = hov || isMobile
  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: isMobile ? 168 : 320, cursor: 'pointer', backgroundColor: B.dark }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <img src={b.image} alt={`Bairro ${b.name}, ${b.cidade}`} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        opacity: hov ? 0.55 : 0.65, transform: hov ? 'scale(1.07)' : 'scale(1)', transition: 'all 0.7s ease',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(16,26,38,0.92) 40%, rgba(16,26,38,0.15) 100%)' }} />
      <div style={{ position: 'absolute', bottom: isMobile ? 10 : 18, left: isMobile ? 8 : 16, right: isMobile ? 8 : 16 }}>
        <p style={{ fontSize: isMobile ? 6 : 7, letterSpacing: '0.3em', textTransform: 'uppercase', color: B.sand, marginBottom: 4, fontFamily: B.sans }}>{b.cidade}</p>
        <h3 style={{ fontFamily: B.serif, fontSize: isMobile ? 12 : 15, color: B.white, lineHeight: 1.2, letterSpacing: '0.02em' }}>{b.name}</h3>
        <div style={{ overflow: 'hidden', maxHeight: show ? 24 : 0, opacity: show ? 1 : 0, transition: 'all 0.4s ease' }}>
          <p style={{ fontSize: isMobile ? 8 : 9, color: 'rgba(255,255,255,0.5)', fontFamily: B.sans, paddingTop: 4 }}>{b.imoveis} imóveis</p>
        </div>
      </div>
    </div>
  )
}

function ProdCard({ p }: { p: (typeof PRODUCTS)[0] }) {
  const [hov, setHov] = useState(false)
  const isMobile = useIsMobile()
  const show = hov || isMobile
  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: isMobile ? 420 : 540, cursor: 'pointer', backgroundColor: '#0a0d10' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <img src={p.image} alt={`${p.title} — Inglaterra Premium`} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        opacity: hov ? 0.5 : 0.35, transform: hov ? 'scale(1.04)' : 'scale(1)', transition: 'all 0.8s ease',
      }} />
      <div style={{ position: 'absolute', top: 22, left: 22 }}>
        <span style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.18)', padding: '5px 10px', fontFamily: B.sans }}>{p.label}</span>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '72px 26px 28px', background: 'linear-gradient(to top, rgba(10,13,16,0.97) 0%, transparent 100%)' }}>
        <h3 style={{ fontFamily: B.serif, fontSize: 24, color: B.white, lineHeight: 1.2, letterSpacing: '0.04em', marginBottom: 12 }}>{p.title}</h3>
        <div style={{ overflow: 'hidden', maxHeight: show ? 120 : 0, opacity: show ? 1 : 0, transition: 'all 0.5s ease' }}>
          <p style={{ fontSize: 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.45)', marginBottom: 18, fontFamily: B.sans }}>{p.desc}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: B.terraLight, fontFamily: B.sans }}>{p.cta}</span>
          <div style={{ height: 1, width: show ? 36 : 18, backgroundColor: B.terraLight, transition: 'width 0.35s ease' }} />
        </div>
      </div>
    </div>
  )
}

function DirCard({ d }: { d: (typeof DIRECTORS)[0] }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ backgroundColor: B.offwhite, borderTop: `3px solid ${hov ? B.terra : 'transparent'}`, transition: 'border-color 0.3s', cursor: 'default' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ aspectRatio: '2 / 3', overflow: 'hidden', backgroundColor: '#c8bdb6' }}>
        <img src={d.image} alt={`${d.name}, ${d.title} da Inglaterra Premium`} style={{
          width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center',
          filter: 'grayscale(20%)',
          transform: hov ? 'scale(1.03)' : 'scale(1)', transition: 'transform 0.7s ease',
        }} />
      </div>
      <div style={{ padding: '24px 26px 30px' }}>
        <p style={{ fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: B.terra, marginBottom: 6, fontFamily: B.sans }}>{d.title}</p>
        <h3 style={{ fontFamily: B.serif, fontSize: 20, letterSpacing: '0.03em', marginBottom: 14, lineHeight: 1.1 }}>{d.name}</h3>
        <p style={{ fontSize: 12, lineHeight: 1.8, color: B.sand, fontStyle: 'italic', borderLeft: `2px solid ${B.terra}`, paddingLeft: 12, fontFamily: B.sans }}>
          {d.quote}
        </p>
      </div>
    </div>
  )
}

function NewsCard({ n }: { n: (typeof NEWS)[0] }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ backgroundColor: B.white, cursor: 'pointer' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ overflow: 'hidden', height: 200, backgroundColor: '#c8bdb6' }}>
        <img src={n.image} alt={n.title} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.7s ease',
        }} />
      </div>
      <div style={{ padding: '22px 22px 26px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans }}>{n.cat}</span>
          <span style={{ fontSize: 8, color: B.sand }}>·</span>
          <span style={{ fontSize: 9, color: B.sand, fontFamily: B.sans }}>{n.date}</span>
        </div>
        <h3 style={{ fontFamily: B.serif, fontSize: 16, lineHeight: 1.35, letterSpacing: '0.02em', marginBottom: 10, textDecoration: hov ? 'underline' : 'none', textUnderlineOffset: 4, textDecorationColor: 'rgba(16,26,38,0.3)' }}>{n.title}</h3>
        <p style={{ fontSize: 11, lineHeight: 1.8, color: B.sand, fontFamily: B.sans }}>{n.excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <span style={{ fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans }}>Ler mais</span>
          <div style={{ height: 1, width: hov ? 28 : 14, backgroundColor: B.terra, transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  )
}

function IgPost({ url, i }: { url: string; i: number }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1', backgroundColor: '#c8bdb6', cursor: 'pointer' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <img src={url} alt={`Publicação ${i + 1} do Instagram da Inglaterra Premium`} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        transform: hov ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.5s ease',
      }} />
      {hov && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(16,26,38,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: B.white, fontSize: 18 }}>♡</span>
        </div>
      )}
    </div>
  )
}

function CaptForm() {
  const [f, setF] = useState({ nome: '', email: '', tel: '', tipo: '', bairro: '', msg: '' })
  const [sent, setSent] = useState(false)
  const isMobile = useIsMobile()
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })
  const inputStyle = { border: 'none', borderBottom: `1px solid rgba(16,26,38,0.15)`, background: 'none', padding: '10px 0', fontSize: 13, color: B.navy, fontFamily: B.sans, outline: 'none', width: '100%' }
  const labelStyle: React.CSSProperties = { fontSize: 7, letterSpacing: '0.35em', textTransform: 'uppercase', color: B.sand, marginBottom: 5, display: 'block', fontFamily: B.sans }
  const fieldRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 20 }

  if (sent) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, minHeight: isMobile ? 'auto' : 340, padding: isMobile ? '20px 0' : 0 }}>
      <div style={{ width: 32, height: 3, backgroundColor: B.terra }} />
      <h3 style={{ fontFamily: B.serif, fontSize: 24, letterSpacing: '0.03em' }}>Recebemos seu contato.</h3>
      <p style={{ fontSize: 12, color: B.sand, lineHeight: 1.9, fontFamily: B.sans }}>Nossa equipe de curadoria analisará seu imóvel e retornará em até 48 horas úteis.</p>
    </div>
  )

  return (
    <form onSubmit={e => { e.preventDefault(); setSent(true) }} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
      <div style={fieldRow}>
        <div><label style={labelStyle}>Nome completo</label><input value={f.nome} onChange={upd('nome')} placeholder="Seu nome" style={inputStyle} /></div>
        <div><label style={labelStyle}>Telefone</label><input value={f.tel} onChange={upd('tel')} placeholder="(43) 9 9999-9999" style={inputStyle} /></div>
      </div>
      <div><label style={labelStyle}>E-mail</label><input type="email" value={f.email} onChange={upd('email')} placeholder="seu@email.com" style={inputStyle} /></div>
      <div style={fieldRow}>
        <div>
          <label style={labelStyle}>Tipo de imóvel</label>
          <select value={f.tipo} onChange={upd('tipo')} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Selecione</option>
            <option>Apartamento</option><option>Casa</option><option>Cobertura</option><option>Comercial</option>
          </select>
        </div>
        <div><label style={labelStyle}>Bairro / localização</label><input value={f.bairro} onChange={upd('bairro')} placeholder="Onde fica?" style={inputStyle} /></div>
      </div>
      <div>
        <label style={labelStyle}>Observações</label>
        <textarea value={f.msg} onChange={upd('msg')} rows={3} placeholder="Conte mais sobre o imóvel…"
          style={{ ...inputStyle, border: `1px solid rgba(16,26,38,0.15)`, padding: '10px 12px', resize: 'none' }} />
      </div>
      <TerraBtn label="Solicitar Avaliação Gratuita" />
    </form>
  )
}

function NewsletterBlock() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const isMobile = useIsMobile()
  return (
    <section style={{ backgroundColor: B.terra, padding: isMobile ? '48px 20px' : '64px 64px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 64, alignItems: 'center' }}>
      <div>
        <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 14, fontFamily: B.sans }}>Newsletter</p>
        <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: 'clamp(24px, 6.5vw, 38px)', color: B.white, lineHeight: 1.15, letterSpacing: '0.04em', marginBottom: 14 }}>
          O mercado premium<br />direto no seu e-mail
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, maxWidth: 340, fontFamily: B.sans }}>
          Lançamentos exclusivos, análises de mercado e seleções da nossa curadoria — antes de todo mundo.
        </p>
      </div>
      {sent ? (
        <div style={{ color: B.white }}>
          <div style={{ width: 28, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', marginBottom: 14 }} />
          <p style={{ fontFamily: B.serif, fontSize: 20, letterSpacing: '0.03em', marginBottom: 8 }}>Obrigado por se inscrever.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: B.sans }}>Você receberá nossa próxima edição em breve.</p>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); if (email.trim()) setSent(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontFamily: B.sans }}>
            Sem spam. Conteúdo com real valor para quem vive ou investe em imóveis de alto padrão. Cancele a qualquer momento.
          </p>
          <div style={{ display: 'flex' }}>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
              style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRight: 'none', padding: '13px 18px', color: B.white, fontSize: 12, fontFamily: B.sans, outline: 'none' }} />
            <button type="submit" style={{
              backgroundColor: B.navy, border: 'none', color: B.white,
              padding: '13px 26px', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: B.sans, transition: 'background-color 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1d2e42' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = B.navy }}
            >Assinar</button>
          </div>
        </form>
      )}
    </section>
  )
}
