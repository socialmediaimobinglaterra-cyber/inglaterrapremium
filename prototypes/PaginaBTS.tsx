import { useState, useEffect } from 'react'
import logoNavy from '@/imports/logo-navy.png'
import logoWhite from '@/imports/logo-white.png'
import diretorWagner from '@/imports/diretor-wagner.jpg'

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

// ─── Listas para os dropdowns do menu (idênticas às outras páginas) ──
const LANCAMENTOS_ATIVOS = ['Imperial Mall Bélgica', 'Residencial Country Vert', 'Edifício Bela Suíça Alta']
const CONDOMINIOS_ATIVOS = ['Reserva Bela Suíça', 'Alto Palhano', 'Village Country']

// ─── Conteúdo da página ──────────────────────────────────────
const ETAPAS = [
  { num: '01', titulo: 'Diagnóstico', texto: 'Entendemos a necessidade da empresa — ou o potencial do terreno — para desenhar o projeto certo.' },
  { num: '02', titulo: 'Projeto sob medida', texto: 'Desenvolvemos o imóvel especificamente para a operação da empresa contratante, sem plantas padronizadas.' },
  { num: '03', titulo: 'Construção acompanhada', texto: 'A obra é acompanhada pela Inglaterra Premium do início ao fim, com relatórios periódicos ao proprietário do terreno.' },
  { num: '04', titulo: 'Contrato de locação', texto: 'Assinatura de contrato de locação de longo prazo, com segurança jurídica para o proprietário e para a empresa locatária.' },
]

const PARA_PROPRIETARIOS = [
  'Renda garantida por contrato de locação de longo prazo',
  'Zero risco e zero custo de construção para você',
  'Empresa locatária qualificada previamente pela Inglaterra',
  'Valorização do terreno sem precisar desenvolvê-lo',
  'Assessoria jurídica e contratual completa',
]

const PARA_EMPRESAS = [
  'Imóvel projetado conforme a operação da sua empresa',
  'Sem necessidade de capital próprio em construção',
  'Localização estratégica em Londrina, à sua escolha',
  'Segurança jurídica em contrato de locação de longo prazo',
  'Acompanhamento da obra até a entrega das chaves',
]

const CASES = [
  {
    nome: 'Centro de Distribuição Zona Sul',
    desc: 'Galpão logístico de 4.200 m² desenvolvido sob medida para operação de e-commerce, com contrato de locação de 15 anos.',
    stat1: { v: '4.200 m²', l: 'Área construída' },
    stat2: { v: '15 anos', l: 'Contrato' },
    image: 'https://picsum.photos/seed/casebts1/900/700',
  },
  {
    nome: 'Sede Administrativa Gleba Palhano',
    desc: 'Edifício corporativo de 3 pavimentos projetado para a sede regional de uma empresa de tecnologia, com contrato de locação de 10 anos.',
    stat1: { v: '1.800 m²', l: 'Área construída' },
    stat2: { v: '10 anos', l: 'Contrato' },
    image: 'https://picsum.photos/seed/casebts2/900/700',
  },
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

function NavDropdown({ label, items }: { label: string; items: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <a href="#" style={{
        fontSize: 11, letterSpacing: '0.08em', textDecoration: 'none', color: B.navy, opacity: 0.5,
        fontFamily: B.sans, borderBottom: '1px solid transparent', paddingBottom: 2,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {label}
        <span style={{ fontSize: 8, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </a>
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', paddingTop: 14,
        opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden',
        transition: 'opacity 0.2s ease', pointerEvents: open ? 'auto' : 'none',
      }}>
        <div style={{ backgroundColor: B.navy, minWidth: 220, boxShadow: '0 20px 44px rgba(16,26,38,0.28)' }}>
          {items.map(nome => (
            <a key={nome} href="#" style={{
              display: 'block', padding: '13px 20px', textDecoration: 'none',
              fontSize: 13, color: B.white, fontFamily: B.sans, fontWeight: 500,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>{nome}</a>
          ))}
        </div>
      </div>
    </div>
  )
}

function CaseCard({ c, isMobile }: { c: (typeof CASES)[0]; isMobile: boolean }) {
  return (
    <div style={{ backgroundColor: B.white }}>
      <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
        <img src={c.image} alt={`Case Inglaterra BTS — ${c.nome}, Londrina`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: isMobile ? '20px 4px' : '24px 4px 0' }}>
        <h3 style={{ fontFamily: B.serif, fontWeight: 400, fontSize: 18, color: B.navy, marginBottom: 10 }}>{c.nome}</h3>
        <p style={{ fontSize: 13, lineHeight: 1.75, color: '#4a4a48', fontFamily: B.sans, marginBottom: 16 }}>{c.desc}</p>
        <div style={{ display: 'flex', gap: 28 }}>
          <div>
            <p style={{ fontFamily: B.serif, fontSize: 20, fontWeight: 500, color: B.terra }}>{c.stat1.v}</p>
            <p style={{ fontSize: 9.5, letterSpacing: '0.05em', textTransform: 'uppercase', color: B.sand, fontFamily: B.sans }}>{c.stat1.l}</p>
          </div>
          <div>
            <p style={{ fontFamily: B.serif, fontSize: 20, fontWeight: 500, color: B.terra }}>{c.stat2.v}</p>
            <p style={{ fontSize: 9.5, letterSpacing: '0.05em', textTransform: 'uppercase', color: B.sand, fontFamily: B.sans }}>{c.stat2.l}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────
export default function PaginaBTS() {
  const [navOpen, setNavOpen] = useState(false)
  const [lancMobileOpen, setLancMobileOpen] = useState(false)
  const [condMobileOpen, setCondMobileOpen] = useState(false)
  const isMobile = useIsMobile()
  const sidePad = isMobile ? 20 : 64
  const NAV_ITEMS_ANTES = ['Comprar', 'Alugar']
  const NAV_ITEMS_DEPOIS = ['Sobre']

  return (
    <div style={{ backgroundColor: B.offwhite, color: B.navy, fontFamily: B.sans }}>

      {/* ── NAV ──────────────────────────────────────────────── */}
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
            <NavDropdown label="Lançamentos" items={LANCAMENTOS_ATIVOS} />
            <NavDropdown label="Condomínios" items={CONDOMINIOS_ATIVOS} />
            <a href="#" style={{
              fontSize: 11, letterSpacing: '0.08em', textDecoration: 'none', color: B.terra,
              fontFamily: B.sans, borderBottom: `1px solid ${B.terra}`, paddingBottom: 2,
            }}>BTS</a>
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

      {/* ── MENU MOBILE ──────────────────────────────────────── */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 54, left: 0, right: 0, zIndex: 49,
          backgroundColor: B.offwhite, borderBottom: `1px solid ${B.navyMid}`,
          maxHeight: navOpen ? 640 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease',
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
            borderBottom: `1px solid ${B.navyMid}`, color: B.navy, fontFamily: B.sans, cursor: 'pointer',
          }}>
            Lançamentos
            <span style={{ fontSize: 10, transform: lancMobileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          <div style={{ maxHeight: lancMobileOpen ? 180 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease', backgroundColor: 'rgba(16,26,38,0.03)' }}>
            {LANCAMENTOS_ATIVOS.map(nome => (
              <a key={nome} href="#" onClick={() => setNavOpen(false)} style={{
                display: 'block', padding: '12px 20px 12px 32px', textDecoration: 'none',
                borderBottom: `1px solid ${B.navyMid}`, fontSize: 12.5, color: B.navy, fontFamily: B.sans,
              }}>{nome}</a>
            ))}
          </div>

          <button onClick={() => setCondMobileOpen(v => !v)} style={{
            display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', fontSize: 13, letterSpacing: '0.06em', background: 'none', border: 'none',
            borderBottom: `1px solid ${B.navyMid}`, color: B.navy, fontFamily: B.sans, cursor: 'pointer',
          }}>
            Condomínios
            <span style={{ fontSize: 10, transform: condMobileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          <div style={{ maxHeight: condMobileOpen ? 180 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease', backgroundColor: 'rgba(16,26,38,0.03)' }}>
            {CONDOMINIOS_ATIVOS.map(nome => (
              <a key={nome} href="#" onClick={() => setNavOpen(false)} style={{
                display: 'block', padding: '12px 20px 12px 32px', textDecoration: 'none',
                borderBottom: `1px solid ${B.navyMid}`, fontSize: 12.5, color: B.navy, fontFamily: B.sans,
              }}>{nome}</a>
            ))}
          </div>

          <a href="#" onClick={() => setNavOpen(false)} style={{
            display: 'block', width: '100%', textAlign: 'left', textDecoration: 'none',
            padding: '16px 20px', fontSize: 13, letterSpacing: '0.06em',
            borderBottom: `1px solid ${B.navyMid}`, color: B.terra, fontFamily: B.sans,
          }}>BTS</a>
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

      {/* ── CABEÇALHO ────────────────────────────────────────── */}
      <div style={{ padding: `${isMobile ? 88 : 108}px ${sidePad}px 0` }}>
        <p style={{ fontSize: 11, color: B.sand, fontFamily: B.sans, marginBottom: 16 }}>Início / Inglaterra BTS</p>
        <span style={{
          display: 'inline-block', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: B.white, backgroundColor: B.terra, padding: '6px 12px', fontFamily: B.sans, fontWeight: 600, marginBottom: 16,
        }}>Built to Suit Corporativo</span>
        <h1 style={{
          fontFamily: B.serif, fontWeight: 300, color: B.navy,
          fontSize: isMobile ? 'clamp(26px, 8vw, 34px)' : 'clamp(32px, 3.6vw, 50px)',
          lineHeight: 1.15, letterSpacing: '0.01em', marginBottom: 14, maxWidth: 720,
        }}>
          Inglaterra BTS — Imóveis Corporativos Sob Medida em Londrina
        </h1>
        <p style={{ fontSize: 14, color: B.sand, lineHeight: 1.7, maxWidth: 580, fontFamily: B.sans, marginBottom: 28 }}>
          Desenvolvemos e locamos imóveis projetados especificamente para a operação da sua empresa — do terreno ao contrato de locação de longo prazo.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="#" style={{
            backgroundColor: B.terra, color: B.white, textDecoration: 'none',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: B.sans, padding: '14px 26px',
          }}>Tenho um terreno</a>
          <a href="#" style={{
            border: `1px solid ${B.navy}`, color: B.navy, textDecoration: 'none',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: B.sans, padding: '14px 26px',
          }}>Preciso de um espaço sob medida</a>
        </div>
      </div>

      {/* ── FOTO PRINCIPAL ───────────────────────────────────── */}
      <div style={{ padding: `${isMobile ? 24 : 32}px ${sidePad}px 0` }}>
        <div style={{ aspectRatio: isMobile ? '4/3' : '21/9', overflow: 'hidden' }}>
          <img src="https://picsum.photos/seed/btsmain/1400/900" alt="Imóvel corporativo sob medida — Inglaterra BTS, Londrina" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* ── NÚMEROS ──────────────────────────────────────────── */}
      <section style={{ padding: `${isMobile ? 32 : 48}px ${sidePad}px` }}>
        <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, marginBottom: 20 }}>Inglaterra BTS em números</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 16 }}>
          {[
            { v: 'R$ 45 mi', l: 'Em contratos ativos' },
            { v: '12 mil m²', l: 'Área construída' },
            { v: '10 anos', l: 'Contrato médio' },
          ].map(f => (
            <div key={f.l} style={{ backgroundColor: B.white, padding: isMobile ? '16px 8px' : '24px 16px', textAlign: 'center' }}>
              <p style={{ fontFamily: B.serif, fontSize: isMobile ? 15 : 24, fontWeight: 500, color: B.navy, marginBottom: 4 }}>{f.v}</p>
              <p style={{ fontSize: isMobile ? 8.5 : 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: B.sand, fontFamily: B.sans }}>{f.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROPRIETÁRIO × EMPRESA ───────────────────────────── */}
      <section style={{ backgroundColor: B.white, padding: `${isMobile ? 40 : 64}px ${sidePad}px`, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 32 : 56 }}>
        <div>
          <h2 style={{ fontFamily: B.serif, fontWeight: 400, fontSize: isMobile ? 19 : 22, color: B.navy, marginBottom: 8 }}>Você tem um terreno?</h2>
          <p style={{ fontSize: 13, color: B.sand, fontFamily: B.sans, marginBottom: 20 }}>Transforme seu terreno em renda garantida, sem construir nada</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PARA_PROPRIETARIOS.map(d => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: B.navy, fontFamily: B.sans, paddingBottom: 10, borderBottom: `1px solid ${B.navyMid}` }}>
                <div style={{ width: 4, height: 4, backgroundColor: B.terra, flexShrink: 0 }} />
                {d}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 style={{ fontFamily: B.serif, fontWeight: 400, fontSize: isMobile ? 19 : 22, color: B.navy, marginBottom: 8 }}>Sua empresa precisa de um espaço sob medida?</h2>
          <p style={{ fontSize: 13, color: B.sand, fontFamily: B.sans, marginBottom: 20 }}>Um imóvel projetado para a sua operação, sem investir em construção</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PARA_EMPRESAS.map(d => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: B.navy, fontFamily: B.sans, paddingBottom: 10, borderBottom: `1px solid ${B.navyMid}` }}>
                <div style={{ width: 4, height: 4, backgroundColor: B.terra, flexShrink: 0 }} />
                {d}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────── */}
      <section style={{ padding: `${isMobile ? 48 : 72}px ${sidePad}px` }}>
        <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, marginBottom: 8 }}>O processo</p>
        <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: isMobile ? 22 : 30, color: B.navy, letterSpacing: '0.01em', marginBottom: isMobile ? 28 : 40, maxWidth: 500 }}>Como funciona</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: isMobile ? 28 : 4 }}>
          {ETAPAS.map((e, i) => (
            <div key={e.num} style={{ padding: isMobile ? 0 : '0 24px 0 0', borderLeft: !isMobile && i > 0 ? `1px solid ${B.navyMid}` : 'none', paddingLeft: !isMobile && i > 0 ? 24 : 0 }}>
              <p style={{ fontFamily: B.serif, fontSize: 26, fontWeight: 300, color: B.terra, marginBottom: 10 }}>{e.num}</p>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: B.navy, fontFamily: B.sans, marginBottom: 10 }}>{e.titulo}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: '#4a4a48', fontFamily: B.sans }}>{e.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CASES DE SUCESSO ─────────────────────────────────── */}
      <section style={{ backgroundColor: B.white, padding: `${isMobile ? 48 : 72}px ${sidePad}px` }}>
        <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, marginBottom: 8 }}>Cases de sucesso</p>
        <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: isMobile ? 22 : 30, color: B.navy, letterSpacing: '0.01em', marginBottom: isMobile ? 24 : 32 }}>
          Imóveis corporativos entregues pela Inglaterra BTS
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 32 : 40 }}>
          {CASES.map(c => <CaseCard key={c.nome} c={c} isMobile={isMobile} />)}
        </div>
      </section>

      {/* ── FALE COM NOSSO ESPECIALISTA ──────────────────────── */}
      <section style={{ padding: `${isMobile ? 48 : 72}px ${sidePad}px` }}>
        <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, marginBottom: 8 }}>Fale com nosso especialista</p>
        <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: isMobile ? 22 : 30, color: B.navy, letterSpacing: '0.01em', marginBottom: isMobile ? 28 : 40, maxWidth: 480 }}>
          Nossa equipe está pronta para estruturar o contrato certo para você
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, maxWidth: 380 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            <img src={diretorWagner} alt="Wagner Lopes Redon, Diretor de Locação da Inglaterra Premium" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
          </div>
          <div>
            <p style={{ fontFamily: B.serif, fontSize: 17, fontWeight: 500, color: B.navy, marginBottom: 2 }}>Wagner Lopes Redon</p>
            <p style={{ fontSize: 12, color: B.sand, fontFamily: B.sans, marginBottom: 8 }}>Diretor de Locação · Inglaterra BTS</p>
            <a href="#" style={{
              display: 'inline-block', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: B.terra, fontFamily: B.sans, fontWeight: 600, borderBottom: `1px solid ${B.terra}`, paddingBottom: 2, textDecoration: 'none',
            }}>Entrar em contato</a>
          </div>
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
