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

// ─── Lista de lançamentos ativos — alimenta o dropdown do menu.
// Quando novos lançamentos entrarem/saírem, é só editar esta lista;
// no Next.js isso vem do banco (mesma fonte que gera /lancamentos/[slug]).
const LANCAMENTOS_ATIVOS = [
  { nome: 'Imperial Mall Bélgica', bairro: 'Gleba Palhano', status: 'Breve Lançamento' },
  { nome: 'Residencial Country Vert', bairro: 'Country Club', status: 'Em Obras' },
  { nome: 'Edifício Bela Suíça Alta', bairro: 'Bela Suíça', status: 'Últimas Unidades' },
]

// ─── Dados de exemplo — o lançamento desta página específica ───
const LANCAMENTO = {
  nome: 'Imperial Mall Bélgica',
  bairro: 'Gleba Palhano',
  status: 'Breve Lançamento',
  entrega: 'Previsão de entrega: 2028',
  faixa: 'A partir de R$ 2.100.000',
  metragens: '95 m² a 320 m²',
  unidades: '1 por andar',
  descricao: 'O Imperial Mall Bélgica nasce na esquina mais valorizada da Gleba Palhano, com fachada assinada e vista permanente para o Lago Igapó. São 24 andares com uma unidade por pavimento, clube privativo de 1.200 m² e integração direta com o polo gastronômico do bairro.',
  descricao2: 'O projeto foi pensado para quem busca exclusividade real — não apenas um endereço, mas uma vizinhança curada, infraestrutura completa e uma arquitetura que vai continuar relevante daqui a vinte anos.',
  diferenciais: [
    'Vista permanente para o Lago Igapó',
    'Clube privativo de 1.200 m²',
    'Uma unidade por andar',
    'Fachada assinada por escritório premiado',
    'Automação residencial de fábrica',
    'Heliponto e portaria blindada',
  ],
  galeria: [
    'https://picsum.photos/seed/lancmain/1400/900',
    'https://picsum.photos/seed/lanc2a/500/400',
    'https://picsum.photos/seed/lanc2b/500/400',
    'https://picsum.photos/seed/lanc2c/500/400',
    'https://picsum.photos/seed/lanc2d/500/400',
    'https://picsum.photos/seed/lanc2e/500/400',
  ],
}

function statusColor(status: string) {
  if (status === 'Últimas Unidades') return B.terra
  if (status === 'Em Obras') return B.sand
  return B.navy
}

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

// ─── Item de nav "Lançamentos" com dropdown no hover (desktop) ──
function NavLancamentosDropdown() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <a href="#" style={{
        fontSize: 11, letterSpacing: '0.08em', textDecoration: 'none', color: B.terra,
        fontFamily: B.sans, borderBottom: `1px solid ${B.terra}`, paddingBottom: 2,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        Lançamentos
        <span style={{ fontSize: 8, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </a>
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', paddingTop: 14,
        opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden',
        transition: 'opacity 0.2s ease', pointerEvents: open ? 'auto' : 'none',
      }}>
        <div style={{ backgroundColor: B.navy, minWidth: 220, boxShadow: '0 20px 44px rgba(16,26,38,0.28)' }}>
          {LANCAMENTOS_ATIVOS.map(l => (
            <a key={l.nome} href="#" style={{
              display: 'block', padding: '13px 20px', textDecoration: 'none',
              fontSize: 13, color: B.white, fontFamily: B.sans, fontWeight: 500,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>{l.nome}</a>
          ))}
        </div>
      </div>
    </div>
  )
}

function OutroLancamentoCard({ l }: { l: (typeof LANCAMENTOS_ATIVOS)[0] & { image: string } }) {
  const [hov, setHov] = useState(false)
  const isMobile = useIsMobile()
  const show = hov || isMobile
  return (
    <a href="#" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '5/4', backgroundColor: B.dark }}>
        <img src={l.image} alt={`${l.nome} — lançamento em ${l.bairro}, Londrina`} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: show ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.6s ease',
        }} />
        <span style={{
          position: 'absolute', top: 14, left: 14, fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: B.white, backgroundColor: statusColor(l.status), padding: '5px 10px', fontFamily: B.sans, fontWeight: 600,
        }}>{l.status}</span>
      </div>
      <div style={{ paddingTop: 14 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.06em', color: B.sand, marginBottom: 5, fontFamily: B.sans }}>{l.bairro}, Londrina</p>
        <h3 style={{ fontFamily: B.serif, fontSize: 15, fontWeight: 400, color: B.navy, lineHeight: 1.3 }}>{l.nome}</h3>
      </div>
    </a>
  )
}

// ─── Página ──────────────────────────────────────────────────
export default function LancamentoDetalhe() {
  const [navOpen, setNavOpen] = useState(false)
  const [lancMobileOpen, setLancMobileOpen] = useState(false)
  const [galeriaAtiva, setGaleriaAtiva] = useState(0)
  const isMobile = useIsMobile()
  const sidePad = isMobile ? 20 : 64
  const NAV_ITEMS_ANTES = ['Comprar', 'Alugar']
  const NAV_ITEMS_DEPOIS = ['Condomínios', 'BTS', 'Sobre']

  const outrosLancamentos = LANCAMENTOS_ATIVOS
    .filter(l => l.nome !== LANCAMENTO.nome)
    .map((l, i) => ({ ...l, image: `https://picsum.photos/seed/outrolanc${i}/900/1100` }))

  return (
    <div style={{ backgroundColor: B.offwhite, color: B.navy, fontFamily: B.sans }}>

      {/* ── NAV (com dropdown de Lançamentos) ───────────────── */}
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
            {NAV_ITEMS_ANTES.map(item => (
              <a key={item} href="#" style={{
                fontSize: 11, letterSpacing: '0.08em', textDecoration: 'none', color: B.navy, opacity: 0.5,
                fontFamily: B.sans, borderBottom: '1px solid transparent', paddingBottom: 2,
              }}>{item}</a>
            ))}
            <NavLancamentosDropdown />
            {NAV_ITEMS_DEPOIS.map(item => (
              <a key={item} href="#" style={{
                fontSize: 11, letterSpacing: '0.08em', textDecoration: 'none', color: B.navy, opacity: 0.5,
                fontFamily: B.sans, borderBottom: '1px solid transparent', paddingBottom: 2,
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

      {/* ── MENU MOBILE (Lançamentos vira sanfona expansível) ── */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 54, left: 0, right: 0, zIndex: 49,
          backgroundColor: B.offwhite, borderBottom: `1px solid ${B.navyMid}`,
          maxHeight: navOpen ? 600 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease',
        }}>
          {NAV_ITEMS_ANTES.map(item => (
            <a key={item} href="#" onClick={() => setNavOpen(false)} style={{
              display: 'block', width: '100%', textAlign: 'left', textDecoration: 'none',
              padding: '16px 20px', fontSize: 13, letterSpacing: '0.06em',
              borderBottom: `1px solid ${B.navyMid}`, color: B.navy, fontFamily: B.sans,
            }}>{item}</a>
          ))}

          <button onClick={() => setLancMobileOpen(v => !v)} style={{
            display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', fontSize: 13, letterSpacing: '0.06em', background: 'none', border: 'none',
            borderBottom: `1px solid ${B.navyMid}`, color: B.terra, fontFamily: B.sans, cursor: 'pointer',
          }}>
            Lançamentos
            <span style={{ fontSize: 10, transform: lancMobileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          <div style={{ maxHeight: lancMobileOpen ? 180 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease', backgroundColor: 'rgba(16,26,38,0.03)' }}>
            {LANCAMENTOS_ATIVOS.map(l => (
              <a key={l.nome} href="#" onClick={() => setNavOpen(false)} style={{
                display: 'block', padding: '12px 20px 12px 32px', textDecoration: 'none',
                borderBottom: `1px solid ${B.navyMid}`, fontSize: 12.5, color: B.navy, fontFamily: B.sans,
              }}>{l.nome}</a>
            ))}
          </div>

          {NAV_ITEMS_DEPOIS.map(item => (
            <a key={item} href="#" onClick={() => setNavOpen(false)} style={{
              display: 'block', width: '100%', textAlign: 'left', textDecoration: 'none',
              padding: '16px 20px', fontSize: 13, letterSpacing: '0.06em',
              borderBottom: `1px solid ${B.navyMid}`, color: B.navy, fontFamily: B.sans,
            }}>{item}</a>
          ))}
          <div style={{ padding: 20 }}><NavBtn label="Contato" /></div>
        </div>
      )}

      {/* ── CABEÇALHO DO LANÇAMENTO ─────────────────────────── */}
      <div style={{ padding: `${isMobile ? 88 : 108}px ${sidePad}px 0` }}>
        <p style={{ fontSize: 11, color: B.sand, fontFamily: B.sans, marginBottom: 16 }}>
          Início / Lançamentos / {LANCAMENTO.nome}
        </p>
        <span style={{
          display: 'inline-block', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: B.white, backgroundColor: statusColor(LANCAMENTO.status), padding: '6px 12px', fontFamily: B.sans, fontWeight: 600, marginBottom: 16,
        }}>{LANCAMENTO.status}</span>
        <h1 style={{
          fontFamily: B.serif, fontWeight: 300, color: B.navy,
          fontSize: isMobile ? 'clamp(26px, 8vw, 34px)' : 'clamp(32px, 3.6vw, 48px)',
          lineHeight: 1.15, letterSpacing: '0.01em', marginBottom: 10, maxWidth: 700,
        }}>
          {LANCAMENTO.nome} — Lançamento em {LANCAMENTO.bairro}, Londrina
        </h1>
        <p style={{ fontSize: 13, color: B.sand, fontFamily: B.sans }}>{LANCAMENTO.entrega}</p>
      </div>

      {/* ── FOTO PRINCIPAL DO LANÇAMENTO ────────────────────── */}
      <div style={{ padding: `${isMobile ? 20 : 28}px ${sidePad}px 0` }}>
        <div style={{ aspectRatio: isMobile ? '4/3' : '21/9', overflow: 'hidden' }}>
          <img src={LANCAMENTO.galeria[0]} alt={`${LANCAMENTO.nome} — perspectiva principal, ${LANCAMENTO.bairro}, Londrina`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* ── FATOS RÁPIDOS ────────────────────────────────────── */}
      <div style={{ padding: `24px ${sidePad}px 0` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 16 }}>
          {[
            { v: LANCAMENTO.metragens, l: 'Metragens' },
            { v: LANCAMENTO.faixa, l: 'Valores' },
            { v: LANCAMENTO.unidades, l: 'Unidades por andar' },
          ].map(f => (
            <div key={f.l} style={{ backgroundColor: B.white, padding: isMobile ? '14px 8px' : '20px 16px', textAlign: 'center' }}>
              <p style={{ fontFamily: B.serif, fontSize: isMobile ? 13 : 17, fontWeight: 500, color: B.navy, marginBottom: 4 }}>{f.v}</p>
              <p style={{ fontSize: isMobile ? 8.5 : 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: B.sand, fontFamily: B.sans }}>{f.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEÇÃO 1 · SOBRE O LANÇAMENTO ────────────────────── */}
      <section style={{ padding: `${isMobile ? 40 : 64}px ${sidePad}px`, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: isMobile ? 28 : 64 }}>
        <div>
          <h2 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.navy, fontWeight: 600, marginBottom: 16, fontFamily: B.sans }}>Sobre o lançamento</h2>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#4a4a48', fontFamily: B.sans, marginBottom: 16, maxWidth: 620 }}>{LANCAMENTO.descricao}</p>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#4a4a48', fontFamily: B.sans, maxWidth: 620 }}>{LANCAMENTO.descricao2}</p>
        </div>
        <div>
          <h2 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.navy, fontWeight: 600, marginBottom: 16, fontFamily: B.sans }}>Diferenciais</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LANCAMENTO.diferenciais.map(d => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: B.navy, fontFamily: B.sans, paddingBottom: 10, borderBottom: `1px solid ${B.navyMid}` }}>
                <div style={{ width: 4, height: 4, backgroundColor: B.terra, flexShrink: 0 }} />
                {d}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2 · GALERIA DE FOTOS ──────────────────────── */}
      <section style={{ padding: `0 ${sidePad}px ${isMobile ? 40 : 64}px` }}>
        <h2 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.navy, fontWeight: 600, marginBottom: 16, fontFamily: B.sans }}>Galeria de fotos</h2>
        {isMobile ? (
          <>
            <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
              <img src={LANCAMENTO.galeria[galeriaAtiva]} alt={`${LANCAMENTO.nome} — foto ${galeriaAtiva + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
              {LANCAMENTO.galeria.map((src, i) => (
                <button key={i} onClick={() => setGaleriaAtiva(i)} style={{
                  flexShrink: 0, width: 56, height: 44, padding: 0, border: `2px solid ${i === galeriaAtiva ? B.terra : 'transparent'}`,
                  overflow: 'hidden', cursor: 'pointer', background: 'none',
                }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 8, height: 520 }}>
            <div style={{ overflow: 'hidden' }}>
              <img src={LANCAMENTO.galeria[0]} alt={`${LANCAMENTO.nome} — perspectiva principal`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8 }}>
              {LANCAMENTO.galeria.slice(1, 5).map((src, i) => (
                <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                  <img src={src} alt={`${LANCAMENTO.nome} — foto ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === 3 && (
                    <div style={{
                      position: 'absolute', inset: 0, backgroundColor: 'rgba(16,26,38,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: B.white, fontSize: 13, fontFamily: B.sans, fontWeight: 500, cursor: 'pointer',
                    }}>+ 22 fotos</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── SEÇÃO 3 · LOCALIZAÇÃO + CONTATO ─────────────────── */}
      <section style={{ backgroundColor: B.white, padding: `${isMobile ? 40 : 64}px ${sidePad}px`, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: isMobile ? 28 : 64 }}>
        <div>
          <h2 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.navy, fontWeight: 600, marginBottom: 16, fontFamily: B.sans }}>Localização</h2>
          <p style={{ fontSize: 13, color: B.sand, fontFamily: B.sans, marginBottom: 16 }}>{LANCAMENTO.bairro}, Londrina — PR</p>
          <div style={{
            height: isMobile ? 200 : 300, backgroundColor: B.offwhite, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: B.sand, fontSize: 12, fontFamily: B.sans, border: `1px dashed ${B.navyMid}`,
          }}>Mapa interativo do lançamento — {LANCAMENTO.bairro}, Londrina</div>
        </div>

        <div style={{ backgroundColor: B.navy, padding: isMobile ? 26 : 32 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.terraLight, fontFamily: B.sans, fontWeight: 600, marginBottom: 20 }}>Quero receber informações</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input placeholder="Seu nome" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: B.white, padding: '12px 14px', fontSize: 13, fontFamily: B.sans, outline: 'none' }} />
            <input placeholder="WhatsApp" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: B.white, padding: '12px 14px', fontSize: 13, fontFamily: B.sans, outline: 'none' }} />
            <input placeholder="E-mail" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: B.white, padding: '12px 14px', fontSize: 13, fontFamily: B.sans, outline: 'none' }} />
            <button style={{
              backgroundColor: B.terra, border: 'none', color: B.white, cursor: 'pointer',
              fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: B.sans, padding: '14px', marginTop: 4,
            }}>Quero saber mais</button>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4 · QUEM VIU ESTE LANÇAMENTO TAMBÉM VIU ───── */}
      <section style={{ padding: `${isMobile ? 48 : 72}px ${sidePad}px` }}>
        <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, marginBottom: 8 }}>Continue explorando</p>
        <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: isMobile ? 22 : 28, color: B.navy, letterSpacing: '0.01em', marginBottom: isMobile ? 24 : 32 }}>
          Quem viu este lançamento também viu
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 28 : 32 }}>
          {outrosLancamentos.map(l => <OutroLancamentoCard key={l.nome} l={l} />)}
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
