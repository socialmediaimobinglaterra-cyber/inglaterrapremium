import { useState, useEffect } from 'react'
import logoNavy from '@/imports/logo-navy.png'
import logoWhite from '@/imports/logo-white.png'

// ─── Responsive helper (idêntico ao da Home — extrair para arquivo
// compartilhado quando migrar para Next.js/Codex) ───────────────
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

// ─── Brand tokens (idênticos à Home) ────────────────────────
const B = {
  navy:       '#101a26',
  terra:      '#51210d',
  terraLight: '#d98a4e', // texto/detalhes sobre fundo escuro — terra puro não passa em contraste
  sand:       '#998376',
  dark:       '#1e1e1e',
  white:      '#ffffff',
  offwhite:   '#F5F3F0',
  navyMid:    'rgba(16,26,38,0.08)',
  serif:      "'DM Sans', system-ui, sans-serif", // manual de marca: só DM Sans em todo o conteúdo — a fonte exclusiva é restrita ao logotipo
  sans:       "'DM Sans', system-ui, sans-serif",
}

// ─── Logo (idêntico à Home) ──────────────────────────────────
function LogoHorizontal({ dark = true }: { dark?: boolean }) {
  return <img src={dark ? logoNavy : logoWhite} alt="Inglaterra Premium" style={{ height: 34, width: 'auto', display: 'block' }} />
}
function LogoFull({ dark = true }: { dark?: boolean }) {
  return <img src={dark ? logoNavy : logoWhite} alt="Inglaterra Premium" style={{ height: 44, width: 'auto', display: 'block' }} />
}

// ─── Dados de exemplo — im\u00f3veis premium em Londrina ────────────
const LISTINGS = [
  { id: '01', title: 'Cobertura duplex com terraço gourmet', bairro: 'Gleba Palhano', tipo: 'Cobertura', area: '420 m²', suites: 4, vagas: 4, price: 'R$ 4.250.000', tag: 'EXCLUSIVO', image: 'https://picsum.photos/seed/inglaterra28/900/1100' },
  { id: '02', title: 'Apartamento alto padrão com vista para o Lago Igapó', bairro: 'Gleba Palhano', tipo: 'Apartamento', area: '210 m²', suites: 3, vagas: 3, price: 'R$ 2.980.000', tag: 'DESTAQUE', image: 'https://picsum.photos/seed/inglaterra29/900/1100' },
  { id: '03', title: 'Casa térrea com piscina de borda infinita', bairro: 'Country Club', tipo: 'Casa', area: '680 m²', suites: 5, vagas: 6, price: 'R$ 6.800.000', tag: 'NOVO', image: 'https://picsum.photos/seed/inglaterra30/900/1100' },
  { id: '04', title: 'Garden com jardim privativo e área gourmet', bairro: 'Bela Suíça', tipo: 'Apartamento', area: '168 m²', suites: 3, vagas: 3, price: 'R$ 2.190.000', tag: 'EXCLUSIVO', image: 'https://picsum.photos/seed/inglaterra31/900/1100' },
  { id: '05', title: 'Casa em condomínio fechado com automação completa', bairro: 'Terra Bonita', tipo: 'Casa', area: '520 m²', suites: 4, vagas: 4, price: 'R$ 5.100.000', tag: 'DESTAQUE', image: 'https://picsum.photos/seed/inglaterra32/900/1100' },
  { id: '06', title: 'Cobertura duplex com terraço e piscina privativa', bairro: 'Bela Suíça', tipo: 'Cobertura', area: '380 m²', suites: 4, vagas: 3, price: 'R$ 3.980.000', tag: 'NOVO', image: 'https://picsum.photos/seed/inglaterra33/900/1100' },
  { id: '07', title: 'Apartamento garden com lazer completo', bairro: 'Country Club', tipo: 'Apartamento', area: '195 m²', suites: 3, vagas: 3, price: 'R$ 2.450.000', tag: 'EXCLUSIVO', image: 'https://picsum.photos/seed/inglaterra34/900/1100' },
  { id: '08', title: 'Terreno em condomínio fechado, pronto para construir', bairro: 'Terra Bonita', tipo: 'Terreno', area: '1.200 m²', suites: 0, vagas: 0, price: 'R$ 1.850.000', tag: 'NOVO', image: 'https://picsum.photos/seed/inglaterra35/900/1100' },
]

const BAIRRO_FILTROS = ['Todos os bairros', 'Gleba Palhano', 'Terra Bonita', 'Bela Suíça', 'Country Club']
const TIPO_FILTROS = ['Todos os tipos', 'Apartamento', 'Casa', 'Cobertura', 'Terreno']
const NEGOCIO_FILTROS = ['Comprar', 'Alugar']
const VALOR_FILTROS = [
  { label: 'Não definido', max: null as number | null },
  { label: 'Até R$ 2.000.000', max: 2_000_000 },
  { label: 'Até R$ 4.000.000', max: 4_000_000 },
  { label: 'Até R$ 6.000.000', max: 6_000_000 },
  { label: 'Até R$ 10.000.000', max: 10_000_000 },
]
const CARACTERISTICAS_FILTROS = ['Não definido', 'Piscina', 'Vista panorâmica', 'Automação completa']

function parsePrice(priceStr: string): number {
  return parseInt(priceStr.replace(/[^\d]/g, ''), 10)
}

// ─── Pill de filtro rápido (label + select nativo estilizado) ─
function PillSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{
      border: `1px solid ${B.navyMid}`, borderRadius: 24, padding: '8px 30px 8px 16px',
      position: 'relative', flexShrink: 0, minWidth: 148,
    }}>
      <span style={{ display: 'block', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: B.sand, marginBottom: 2, fontFamily: B.sans }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        border: 'none', background: 'none', fontSize: 13, color: B.navy, fontFamily: B.sans, fontWeight: 500,
        cursor: 'pointer', outline: 'none', width: '100%', appearance: 'none',
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: B.sand, pointerEvents: 'none' }}>▾</span>
    </div>
  )
}

function IconFiltros() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 4h14M4 8h8M6.5 12h3" stroke={B.navy} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="4" cy="4" r="1.3" fill={B.white} stroke={B.navy} strokeWidth="1.1" />
      <circle cx="10" cy="8" r="1.3" fill={B.white} stroke={B.navy} strokeWidth="1.1" />
      <circle cx="7" cy="12" r="1.3" fill={B.white} stroke={B.navy} strokeWidth="1.1" />
    </svg>
  )
}

function IconSalvar() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2h10v12l-5-3-5 3V2z" stroke={B.white} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}


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

// ─── Card de resultado — specs sempre visíveis (sem hover-gate,
// esta é a página de comparação, o usuário precisa ver tudo de cara) ─
function ListingCard({ p }: { p: (typeof LISTINGS)[0] }) {
  const [hov, setHov] = useState(false)
  const isMobile = useIsMobile()
  return (
    <a href="#" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: isMobile ? '4/3' : '5/4', backgroundColor: B.dark, cursor: 'pointer' }}>
        <img src={p.image} alt={`${p.title} — ${p.bairro}, Londrina`} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.6s ease',
        }} />
        <span style={{
          position: 'absolute', top: 14, left: 14, fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: B.white, border: '1px solid rgba(255,255,255,0.4)', padding: '5px 10px', fontFamily: B.sans,
        }}>{p.tag}</span>
      </div>
      <div style={{ paddingTop: 16 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.06em', color: B.sand, marginBottom: 6, fontFamily: B.sans }}>{p.bairro}, Londrina</p>
        <h3 style={{ fontFamily: B.serif, fontSize: 16, color: B.navy, lineHeight: 1.3, marginBottom: 10, fontWeight: 400, letterSpacing: '0.01em' }}>{p.title}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1px solid ${B.navyMid}`, paddingTop: 10 }}>
          <span style={{ fontSize: 11, color: B.sand, fontFamily: B.sans }}>
            {p.area}{p.suites > 0 ? ` · ${p.suites} suítes` : ''}{p.vagas > 0 ? ` · ${p.vagas} vagas` : ''}
          </span>
          <span style={{ fontFamily: B.serif, fontSize: 17, color: B.navy }}>{p.price}</span>
        </div>
      </div>
    </a>
  )
}

// ─── Página ──────────────────────────────────────────────────
export default function BuscaImoveis() {
  const [navOpen, setNavOpen] = useState(false)
  const [negocioAtivo, setNegocioAtivo] = useState('Comprar')
  const [bairroAtivo, setBairroAtivo] = useState('Todos os bairros')
  const [tipoAtivo, setTipoAtivo] = useState('Todos os tipos')
  const [valorAtivo, setValorAtivo] = useState('Não definido')
  const [caracteristicaAtiva, setCaracteristicaAtiva] = useState('Não definido')
  const isMobile = useIsMobile()
  const sidePad = isMobile ? 20 : 64
  const NAV_ITEMS = ['Comprar', 'Alugar', 'Lançamentos', 'Condomínios', 'BTS', 'Sobre']

  const priceMax = VALOR_FILTROS.find(v => v.label === valorAtivo)?.max ?? null
  const resultados = LISTINGS.filter(p => {
    if (bairroAtivo !== 'Todos os bairros' && p.bairro !== bairroAtivo) return false
    if (tipoAtivo !== 'Todos os tipos' && p.tipo !== tipoAtivo) return false
    if (priceMax && parsePrice(p.price) > priceMax) return false
    return true
  })

  function limparBusca() {
    setBairroAtivo('Todos os bairros'); setTipoAtivo('Todos os tipos')
    setValorAtivo('Não definido'); setCaracteristicaAtiva('Não definido')
  }

  return (
    <div style={{ backgroundColor: B.offwhite, color: B.navy, fontFamily: B.sans }}>

      {/* ── NAV (idêntico à Home) ──────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `14px ${sidePad}px`,
        backgroundColor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)',
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
                color: item === 'Comprar' ? B.terra : B.navy,
                opacity: item === 'Comprar' ? 1 : 0.5,
                fontFamily: B.sans, borderBottom: item === 'Comprar' ? `1px solid ${B.terra}` : '1px solid transparent',
                paddingBottom: 2,
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
              borderBottom: `1px solid ${B.navyMid}`,
              color: item === 'Comprar' ? B.terra : B.navy, fontFamily: B.sans,
            }}>{item}</a>
          ))}
          <div style={{ padding: 20 }}><NavBtn label="Contato" /></div>
        </div>
      )}

      {/* ── CABEÇALHO DA PÁGINA ────────────────────────────── */}
      <section style={{ paddingTop: isMobile ? 96 : 128 }}>
        <div style={{ padding: `0 ${sidePad}px`, marginBottom: isMobile ? 28 : 40 }}>
          <p style={{ fontSize: 11, color: B.sand, marginBottom: 16, fontFamily: B.sans }}>Início / Imóveis / Comprar</p>
          <h1 style={{
            fontFamily: B.serif, fontWeight: 300, color: B.navy,
            fontSize: isMobile ? 'clamp(26px, 8vw, 34px)' : 'clamp(34px, 4vw, 52px)',
            lineHeight: 1.1, letterSpacing: '0.02em', marginBottom: 14, maxWidth: 720,
          }}>
            Imóveis de Alto Padrão à Venda em Londrina
          </h1>
          <p style={{ fontSize: 14, color: B.sand, lineHeight: 1.7, maxWidth: 520, fontFamily: B.sans }}>
            Seleção curada de casas, apartamentos e coberturas nos bairros mais valorizados da cidade — Gleba Palhano, Bela Suíça, Country Club e Terra Bonita.
          </p>
        </div>
      </section>

      {/* ── FILTROS RÁPIDOS ─────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${B.navyMid}`, borderBottom: `1px solid ${B.navyMid}` }}>
        <div style={{
          padding: `${isMobile ? 16 : 14}px ${sidePad}px`,
          display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 14,
          overflowX: isMobile ? 'auto' : 'visible', flexWrap: isMobile ? 'nowrap' : 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingRight: 6 }}>
            <IconFiltros />
            <div>
              <p style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, lineHeight: 1.3 }}>Filtros rápidos</p>
              <p style={{ fontSize: 12, color: B.navy, fontFamily: B.sans, fontWeight: 500, lineHeight: 1.3 }}>Refine a sua busca</p>
            </div>
          </div>

          <PillSelect label="Tipo" value={tipoAtivo} onChange={setTipoAtivo} options={TIPO_FILTROS} />
          <PillSelect label="Negócio" value={negocioAtivo} onChange={setNegocioAtivo} options={NEGOCIO_FILTROS} />
          <PillSelect label="Localização" value={bairroAtivo} onChange={setBairroAtivo} options={BAIRRO_FILTROS} />
          <PillSelect label="Valor" value={valorAtivo} onChange={setValorAtivo} options={VALOR_FILTROS.map(v => v.label)} />
          <PillSelect label="Características" value={caracteristicaAtiva} onChange={setCaracteristicaAtiva} options={CARACTERISTICAS_FILTROS} />

          <button style={{
            backgroundColor: B.navy, border: 'none', color: B.white, cursor: 'pointer', flexShrink: 0,
            fontSize: 12, fontFamily: B.sans, fontWeight: 500, padding: '13px 26px', borderRadius: 24,
          }}>Buscar</button>

          {!isMobile && (
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
              <button aria-label="Filtros avançados" style={{
                width: 38, height: 38, borderRadius: '50%', border: `1px solid ${B.navyMid}`, background: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><IconFiltros /></button>
              <button aria-label="Salvar busca" style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none', backgroundColor: B.navy, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><IconSalvar /></button>
            </div>
          )}
        </div>
      </div>


      {/* ── RESULTADOS ──────────────────────────────────────── */}
      <section style={{ padding: `${isMobile ? 28 : 40}px ${sidePad}px ${isMobile ? 64 : 96}px` }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'baseline', marginBottom: isMobile ? 28 : 40, paddingBottom: 20, borderBottom: `1px solid ${B.navyMid}` }}>
          <p style={{ fontSize: isMobile ? 18 : 20, color: B.navy, fontFamily: B.sans, fontWeight: 500 }}>
            Resultados da busca <span style={{ fontSize: 14, color: B.sand, fontWeight: 400 }}>{resultados.length} imóveis encontrados</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: B.sand, fontFamily: B.sans }}>Ordenar por</span>
            <select style={{ border: 'none', fontSize: 12, color: B.navy, fontFamily: B.sans, fontWeight: 500, background: 'none', cursor: 'pointer' }}>
              <option>Relevância</option>
              <option>Maior valor</option>
              <option>Menor valor</option>
              <option>Mais recentes</option>
            </select>
          </div>
        </div>

        {resultados.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 36 : 40 }}>
            {resultados.map(p => <ListingCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 15, color: B.sand, fontFamily: B.sans, marginBottom: 16 }}>Nenhum imóvel encontrado com esses critérios.</p>
            <button onClick={limparBusca} style={{
              border: `1px solid ${B.navy}`, background: 'none', color: B.navy, cursor: 'pointer',
              fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: B.sans, padding: '12px 28px',
            }}>Ver todos os imóveis</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: isMobile ? 40 : 64 }}>
          <button style={{
            border: `1px solid ${B.navy}`, background: 'none', color: B.navy, cursor: 'pointer',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: B.sans,
            padding: '14px 36px', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = B.navy; (e.currentTarget as HTMLButtonElement).style.color = B.white }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = B.navy }}
          >Carregar mais imóveis</button>
        </div>
      </section>

      {/* ── FOOTER (idêntico à Home) ───────────────────────── */}
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
