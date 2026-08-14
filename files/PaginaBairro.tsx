import { useState, useEffect } from 'react'
import logoNavy from '@/imports/logo-navy.png'
import logoWhite from '@/imports/logo-white.png'

// ─── Responsive helper (idêntico às demais páginas) ─────────
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

// ─── Brand tokens (idênticos às demais páginas) ─────────────
const B = {
  navy:       '#101a26',
  terra:      '#51210d',
  terraLight: '#d98a4e', // texto/detalhes sobre fundo escuro — terra puro não passa em contraste
  sand:       '#998376',
  dark:       '#1e1e1e',
  white:      '#ffffff',
  offwhite:   '#F5F3F0',
  navyMid:    'rgba(16,26,38,0.08)',
  serif:      "'DM Sans', system-ui, sans-serif", // manual de marca: só DM Sans — fonte exclusiva restrita ao logotipo
  sans:       "'DM Sans', system-ui, sans-serif",
}

// ─── Logo (idêntico às demais páginas) ──────────────────────
function LogoHorizontal({ dark = true }: { dark?: boolean }) {
  return <img src={dark ? logoNavy : logoWhite} alt="Inglaterra Premium" style={{ height: 34, width: 'auto', display: 'block' }} />
}
function LogoFull({ dark = true }: { dark?: boolean }) {
  return <img src={dark ? logoNavy : logoWhite} alt="Inglaterra Premium" style={{ height: 44, width: 'auto', display: 'block' }} />
}

// ─── Dados de exemplo — Gleba Palhano, o bairro mais citado
// nas outras telas do protótipo (mantém a jornada coerente) ──
const BAIRRO = {
  nome: 'Gleba Palhano',
  descricaoP1: 'Reconhecida como o endereço mais valorizado de Londrina, a Gleba Palhano reúne torres residenciais de alto padrão às margens do Lago Igapó. O bairro concentra a maior densidade de empreendimentos premium da cidade, com projetos arquitetônicos assinados, vista permanente para a área verde e proximidade com os principais polos gastronômicos e de serviços.',
  descricaoP2: 'É também a região com maior valorização média nos últimos cinco anos entre os bairros acompanhados pela Inglaterra Premium — um movimento puxado pela combinação entre escassez de terrenos, qualidade urbanística e demanda de compradores de outras cidades do Paraná.',
  valorMedio: 'R$ 3,4 M',
  valorizacao: '+18%',
  imoveisDisponiveis: 38,
  imagem: 'https://picsum.photos/seed/bairrohero/1800/1000',
}

const IMOVEIS_BAIRRO = [
  { titulo: 'Cobertura duplex com terraço gourmet', preco: 'R$ 4.250.000', tag: 'EXCLUSIVO', area: '420 m²', suites: 4, image: 'https://picsum.photos/seed/bairroimovel1/900/1100' },
  { titulo: 'Apartamento com vista para o Lago Igapó', preco: 'R$ 2.980.000', tag: 'DESTAQUE', area: '210 m²', suites: 3, image: 'https://picsum.photos/seed/bairroimovel2/900/1100' },
  { titulo: 'Apartamento garden com jardim privativo', preco: 'R$ 3.480.000', tag: 'EXCLUSIVO', area: '265 m²', suites: 3, image: 'https://picsum.photos/seed/bairroimovel3/900/1100' },
]

const OUTROS_BAIRROS = [
  { nome: 'Terra Bonita', imoveis: 24, image: 'https://picsum.photos/seed/outrobairro1/500/650' },
  { nome: 'Bela Suíça', imoveis: 44, image: 'https://picsum.photos/seed/outrobairro2/500/650' },
  { nome: 'Country Club', imoveis: 21, image: 'https://picsum.photos/seed/outrobairro3/500/650' },
]

// ─── Helpers de UI (idênticos às demais páginas) ────────────
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

function ImovelCard({ p }: { p: (typeof IMOVEIS_BAIRRO)[0] }) {
  const [hov, setHov] = useState(false)
  const isMobile = useIsMobile()
  const show = hov || isMobile
  return (
    <a href="#" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '5/4', backgroundColor: B.dark }}>
        <img src={p.image} alt={`${p.titulo} — ${BAIRRO.nome}, Londrina`} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: show ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.6s ease',
        }} />
        <span style={{
          position: 'absolute', top: 14, left: 14, fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: B.white, border: '1px solid rgba(255,255,255,0.4)', padding: '5px 10px', fontFamily: B.sans,
        }}>{p.tag}</span>
      </div>
      <div style={{ paddingTop: 14 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.06em', color: B.sand, marginBottom: 5, fontFamily: B.sans }}>{BAIRRO.nome}, Londrina</p>
        <h3 style={{ fontFamily: B.serif, fontSize: 15, fontWeight: 400, color: B.navy, lineHeight: 1.3, marginBottom: 10 }}>{p.titulo}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1px solid ${B.navyMid}`, paddingTop: 10 }}>
          <span style={{ fontSize: 11, color: B.sand, fontFamily: B.sans }}>{p.area} · {p.suites} suítes</span>
          <span style={{ fontFamily: B.serif, fontSize: 17, fontWeight: 500, color: B.navy }}>{p.preco}</span>
        </div>
      </div>
    </a>
  )
}

// ─── Página ──────────────────────────────────────────────────
export default function PaginaBairro() {
  const [navOpen, setNavOpen] = useState(false)
  const isMobile = useIsMobile()
  const sidePad = isMobile ? 20 : 64
  const NAV_ITEMS = ['Comprar', 'Alugar', 'Lançamentos', 'Condomínios', 'BTS', 'Sobre']

  return (
    <div style={{ backgroundColor: B.offwhite, color: B.navy, fontFamily: B.sans }}>

      {/* ── NAV (idêntico às demais páginas) ────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `14px ${sidePad}px`,
        backgroundColor: 'rgba(245,243,240,0.96)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${B.navyMid}`,
      }}>
        <div style={{ transform: isMobile ? 'scale(0.85)' : 'none', transformOrigin: 'left center' }}>
          <LogoHorizontal dark />
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {NAV_ITEMS.map(item => (
              <a key={item} href="#" style={{
                fontSize: 11, letterSpacing: '0.08em', textDecoration: 'none',
                color: B.navy, opacity: 0.5, fontFamily: B.sans,
                borderBottom: '1px solid transparent', paddingBottom: 2,
              }}>{item}</a>
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

      {isMobile && (
        <div style={{
          position: 'fixed', top: 54, left: 0, right: 0, zIndex: 49,
          backgroundColor: B.offwhite, borderBottom: `1px solid ${B.navyMid}`,
          maxHeight: navOpen ? 480 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease',
        }}>
          {NAV_ITEMS.map(item => (
            <a key={item} href="#" onClick={() => setNavOpen(false)} style={{
              display: 'block', width: '100%', textAlign: 'left', textDecoration: 'none',
              padding: '16px 20px', fontSize: 13, letterSpacing: '0.06em',
              borderBottom: `1px solid ${B.navyMid}`, color: B.navy, fontFamily: B.sans,
            }}>{item}</a>
          ))}
          <div style={{ padding: 20 }}><NavBtn label="Contato" /></div>
        </div>
      )}

      {/* ── HERO DO BAIRRO ──────────────────────────────────── */}
      <section style={{ position: 'relative', height: isMobile ? '52vh' : '66vh', minHeight: isMobile ? 340 : 480, display: 'flex', alignItems: 'flex-end' }}>
        <img src={BAIRRO.imagem} alt={`Vista do bairro ${BAIRRO.nome}, Londrina`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(16,26,38,0.05) 0%, rgba(16,26,38,0.8) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 2, padding: `0 ${sidePad}px ${isMobile ? 32 : 56}px`, width: '100%' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: B.terraLight, fontFamily: B.sans, fontWeight: 600, marginBottom: 12 }}>Conheça o bairro</p>
          <h1 style={{
            fontFamily: B.serif, fontWeight: 300, color: B.white,
            fontSize: isMobile ? 'clamp(28px, 9vw, 40px)' : 'clamp(36px, 4.5vw, 58px)',
            letterSpacing: '0.01em', lineHeight: 1.1,
          }}>
            Imóveis de Alto Padrão em<br />{BAIRRO.nome}, Londrina
          </h1>
        </div>
      </section>

      {/* ── INTRODUÇÃO + DADOS ──────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', gap: isMobile ? 32 : 80, padding: `${isMobile ? 40 : 72}px ${sidePad}px`, borderBottom: `1px solid ${B.navyMid}` }}>
        <div>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#4a4a48', fontFamily: B.sans, marginBottom: 18 }}>{BAIRRO.descricaoP1}</p>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#4a4a48', fontFamily: B.sans, marginBottom: isMobile ? 24 : 32 }}>{BAIRRO.descricaoP2}</p>
          <a href="#" style={{
            display: 'inline-block', border: `1px solid ${B.navy}`, color: B.navy, textDecoration: 'none',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: B.sans, padding: '13px 28px',
          }}>Ver os {BAIRRO.imoveisDisponiveis} imóveis do bairro</a>
        </div>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', flexWrap: 'wrap', gap: isMobile ? 20 : 28 }}>
          {[
            { v: BAIRRO.valorMedio, l: 'Valor médio de venda' },
            { v: BAIRRO.valorizacao, l: 'Valorização em 5 anos' },
            { v: String(BAIRRO.imoveisDisponiveis), l: 'Imóveis premium disponíveis' },
          ].map(f => (
            <div key={f.l} style={{ flex: isMobile ? '1 1 28%' : 'none', paddingBottom: isMobile ? 0 : 24, borderBottom: isMobile ? 'none' : `1px solid ${B.navyMid}` }}>
              <p style={{ fontFamily: B.serif, fontSize: isMobile ? 24 : 32, fontWeight: 300, color: B.navy, marginBottom: 4 }}>{f.v}</p>
              <p style={{ fontSize: isMobile ? 9 : 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: B.sand, fontFamily: B.sans, lineHeight: 1.4 }}>{f.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── IMÓVEIS NO BAIRRO ───────────────────────────────── */}
      <section style={{ padding: `${isMobile ? 40 : 64}px ${sidePad}px`, backgroundColor: B.white }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0, justifyContent: 'space-between', marginBottom: isMobile ? 28 : 36 }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, marginBottom: 8 }}>{BAIRRO.nome}</p>
            <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: isMobile ? 22 : 30, color: B.navy, letterSpacing: '0.01em' }}>Imóveis disponíveis no bairro</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 32 : 32 }}>
          {IMOVEIS_BAIRRO.map(p => <ImovelCard key={p.titulo} p={p} />)}
        </div>
      </section>

      {/* ── OUTROS BAIRROS ──────────────────────────────────── */}
      <section style={{ padding: `${isMobile ? 40 : 64}px ${sidePad}px` }}>
        <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, marginBottom: 8 }}>Explore mais</p>
        <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: isMobile ? 22 : 30, color: B.navy, letterSpacing: '0.01em', marginBottom: isMobile ? 24 : 32 }}>Outros bairros de alto padrão em Londrina</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 16 : 4 }}>
          {OUTROS_BAIRROS.map(b => (
            <a key={b.nome} href="#" style={{ position: 'relative', display: 'block', aspectRatio: isMobile ? '16/10' : '4/5', overflow: 'hidden', textDecoration: 'none' }}>
              <img src={b.image} alt={`Bairro ${b.nome}, Londrina`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(16,26,38,0.85) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18 }}>
                <p style={{ fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terraLight, fontFamily: B.sans, marginBottom: 4 }}>{b.imoveis} imóveis</p>
                <p style={{ fontFamily: B.serif, fontSize: 18, fontWeight: 400, color: B.white }}>{b.nome}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── FOOTER (idêntico às demais páginas) ─────────────── */}
      <footer style={{ backgroundColor: B.navy, color: B.white, padding: isMobile ? '48px 20px 24px' : '64px 64px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr 1fr', gap: isMobile ? 36 : 48, marginBottom: isMobile ? 36 : 52 }}>
          <div>
            <div style={{ marginBottom: 24 }}><LogoFull dark={false} /></div>
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
                  <a key={l} href="#" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontFamily: B.sans }}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 3, backgroundColor: B.terra, marginBottom: 20 }} />
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center' }}>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: B.sans }}>© 2026 Inglaterra Premium · Todos os direitos reservados</p>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: B.sans }}>Política de Privacidade · Termos de Uso</p>
        </div>
      </footer>
    </div>
  )
}
