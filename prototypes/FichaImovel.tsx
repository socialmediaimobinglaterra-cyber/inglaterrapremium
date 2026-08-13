import { useState, useEffect } from 'react'
import logoNavy from '@/imports/logo-navy.png'
import logoWhite from '@/imports/logo-white.png'

// ─── Responsive helper (idêntico às demais páginas — extrair para
// arquivo compartilhado quando migrar para Next.js/Codex) ───────
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

// ─── Dados de exemplo — o mesmo imóvel usado na Busca, para manter
// consistência entre as telas do protótipo ───────────────────
const IMOVEL = {
  titulo: 'Cobertura Duplex com Terraço Gourmet',
  bairro: 'Gleba Palhano',
  endereco: 'Rua Doutor Vicente de Carvalho, Gleba Palhano — Londrina, PR',
  preco: 'R$ 4.250.000',
  tipo: 'Cobertura',
  area: '420 m²',
  suites: 4,
  vagas: 4,
  pavimentos: 2,
  descricao: 'Cobertura duplex com vista panorâmica para o Lago Igapó, distribuída em dois pavimentos integrados por escada em mármore. Living amplo com pé-direito duplo, cozinha gourmet integrada e terraço com piscina privativa e churrasqueira — projetada para receber com conforto e privacidade, nos padrões da Inglaterra Premium.',
  diferenciais: [
    'Piscina privativa no terraço',
    'Vista panorâmica para o Lago Igapó',
    'Automação residencial completa',
    '4 vagas cobertas demarcadas',
    'Depósito privativo',
    'Condomínio com segurança 24h',
  ],
  galeria: [
    'https://picsum.photos/seed/fichamain/1400/900',
    'https://picsum.photos/seed/ficha2/500/400',
    'https://picsum.photos/seed/ficha3/500/400',
    'https://picsum.photos/seed/ficha4/500/400',
    'https://picsum.photos/seed/ficha5/500/400',
    'https://picsum.photos/seed/ficha6/500/400',
  ],
}

const SEMELHANTES = [
  { titulo: 'Apartamento garden com jardim privativo', bairro: 'Gleba Palhano', preco: 'R$ 3.480.000', tag: 'EXCLUSIVO', image: 'https://picsum.photos/seed/semelhante1/900/1100' },
  { titulo: 'Alto padrão com lazer completo', bairro: 'Bela Suíça', preco: 'R$ 2.190.000', tag: 'DESTAQUE', image: 'https://picsum.photos/seed/semelhante2/900/1100' },
  { titulo: 'Casa térrea assinada, piscina de borda infinita', bairro: 'Country Club', preco: 'R$ 6.800.000', tag: 'NOVO', image: 'https://picsum.photos/seed/semelhante3/900/1100' },
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

function SimilarCard({ p }: { p: (typeof SEMELHANTES)[0] }) {
  const [hov, setHov] = useState(false)
  const isMobile = useIsMobile()
  const show = hov || isMobile
  return (
    <a href="#" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '5/4', backgroundColor: B.dark }}>
        <img src={p.image} alt={`${p.titulo} — ${p.bairro}, Londrina`} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: show ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.6s ease',
        }} />
        <span style={{
          position: 'absolute', top: 14, left: 14, fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: B.white, border: '1px solid rgba(255,255,255,0.4)', padding: '5px 10px', fontFamily: B.sans,
        }}>{p.tag}</span>
      </div>
      <div style={{ paddingTop: 14 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.06em', color: B.sand, marginBottom: 5, fontFamily: B.sans }}>{p.bairro}, Londrina</p>
        <h3 style={{ fontFamily: B.serif, fontSize: 15, fontWeight: 400, color: B.navy, lineHeight: 1.3, marginBottom: 8 }}>{p.titulo}</h3>
        <p style={{ fontFamily: B.serif, fontSize: 16, fontWeight: 500, color: B.navy }}>{p.preco}</p>
      </div>
    </a>
  )
}

// ─── Página ──────────────────────────────────────────────────
export default function FichaImovel() {
  const [navOpen, setNavOpen] = useState(false)
  const [galeriaAtiva, setGaleriaAtiva] = useState(0)
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

      {/* ── BREADCRUMB ──────────────────────────────────────── */}
      <div style={{ paddingTop: isMobile ? 88 : 108, padding: `${isMobile ? 88 : 108}px ${sidePad}px 0` }}>
        <p style={{ fontSize: 11, color: B.sand, fontFamily: B.sans }}>
          Início / Imóveis / {IMOVEL.bairro} / {IMOVEL.titulo}
        </p>
      </div>

      {/* ── GALERIA ─────────────────────────────────────────── */}
      <section style={{ padding: `20px ${sidePad}px 0` }}>
        {isMobile ? (
          <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
            <img src={IMOVEL.galeria[galeriaAtiva]} alt={`${IMOVEL.titulo} — foto ${galeriaAtiva + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 8, height: 560 }}>
            <div style={{ overflow: 'hidden' }}>
              <img src={IMOVEL.galeria[0]} alt={`${IMOVEL.titulo} — foto principal`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8 }}>
              {IMOVEL.galeria.slice(1, 5).map((src, i) => (
                <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                  <img src={src} alt={`${IMOVEL.titulo} — foto ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === 3 && (
                    <div style={{
                      position: 'absolute', inset: 0, backgroundColor: 'rgba(16,26,38,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: B.white, fontSize: 13, fontFamily: B.sans, fontWeight: 500, cursor: 'pointer',
                    }}>+ 14 fotos</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {isMobile && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
            {IMOVEL.galeria.map((src, i) => (
              <button key={i} onClick={() => setGaleriaAtiva(i)} style={{
                flexShrink: 0, width: 56, height: 44, padding: 0, border: `2px solid ${i === galeriaAtiva ? B.terra : 'transparent'}`,
                overflow: 'hidden', cursor: 'pointer', background: 'none',
              }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── CORPO: DETALHES + CONTATO ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: isMobile ? 40 : 72, padding: `${isMobile ? 32 : 56}px ${sidePad}px ${isMobile ? 64 : 96}px` }}>
        <div>
          {/* Cabeçalho do imóvel */}
          <div style={{ paddingBottom: isMobile ? 24 : 32, borderBottom: `1px solid ${B.navyMid}`, marginBottom: isMobile ? 24 : 32 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, marginBottom: 12 }}>{IMOVEL.tipo} · Venda</p>
            <h1 style={{
              fontFamily: B.serif, fontWeight: 300, color: B.navy,
              fontSize: isMobile ? 'clamp(24px, 7vw, 30px)' : 'clamp(28px, 3vw, 40px)',
              lineHeight: 1.15, letterSpacing: '0.01em', marginBottom: 12, maxWidth: 620,
            }}>
              {IMOVEL.titulo} em {IMOVEL.bairro}, Londrina
            </h1>
            <p style={{ fontSize: 13, color: B.sand, marginBottom: 20, fontFamily: B.sans }}>{IMOVEL.endereco}</p>
            <p style={{ fontFamily: B.serif, fontSize: isMobile ? 24 : 30, fontWeight: 500, color: B.navy }}>{IMOVEL.preco}</p>
          </div>

          {/* Fatos rápidos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? 8 : 16, marginBottom: isMobile ? 32 : 44 }}>
            {[
              { v: IMOVEL.area, l: 'Área privativa' },
              { v: String(IMOVEL.suites), l: 'Suítes' },
              { v: String(IMOVEL.vagas), l: 'Vagas' },
              { v: String(IMOVEL.pavimentos), l: 'Pavimentos' },
            ].map(f => (
              <div key={f.l} style={{ backgroundColor: B.white, padding: isMobile ? '14px 8px' : '20px 16px', textAlign: 'center' }}>
                <p style={{ fontFamily: B.serif, fontSize: isMobile ? 18 : 24, fontWeight: 300, color: B.navy, marginBottom: 4 }}>{f.v}</p>
                <p style={{ fontSize: isMobile ? 8.5 : 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: B.sand, fontFamily: B.sans }}>{f.l}</p>
              </div>
            ))}
          </div>

          {/* Sobre o imóvel */}
          <div style={{ marginBottom: isMobile ? 32 : 44 }}>
            <h2 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.navy, fontWeight: 600, marginBottom: 16, fontFamily: B.sans }}>Sobre o imóvel</h2>
            <p style={{ fontSize: 14, lineHeight: 1.85, color: '#4a4a48', maxWidth: 640, fontFamily: B.sans }}>{IMOVEL.descricao}</p>
          </div>

          {/* Diferenciais */}
          <div style={{ marginBottom: isMobile ? 32 : 44 }}>
            <h2 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.navy, fontWeight: 600, marginBottom: 18, fontFamily: B.sans }}>Diferenciais</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 10 : '14px 28px' }}>
              {IMOVEL.diferenciais.map(d => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: B.navy, fontFamily: B.sans, paddingBottom: 10, borderBottom: `1px solid ${B.navyMid}` }}>
                  <div style={{ width: 4, height: 4, backgroundColor: B.terra, flexShrink: 0 }} />
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Localização */}
          <div>
            <h2 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.navy, fontWeight: 600, marginBottom: 16, fontFamily: B.sans }}>Localização</h2>
            <div style={{
              height: isMobile ? 200 : 260, backgroundColor: B.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: B.sand, fontSize: 12, fontFamily: B.sans, border: `1px dashed ${B.navyMid}`,
            }}>Mapa interativo do imóvel — {IMOVEL.bairro}, Londrina</div>
          </div>
        </div>

        {/* ── CARD DO CORRETOR ────────────────────────────── */}
        <aside>
          <div style={{ backgroundColor: B.navy, padding: isMobile ? 26 : 32, position: isMobile ? 'static' : 'sticky', top: 100 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.terraLight, fontFamily: B.sans, fontWeight: 600, marginBottom: 26 }}>Fale com uma especialista</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26, paddingBottom: 26, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 500, color: B.white, fontFamily: B.sans }}>Marina Costa</p>
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontFamily: B.sans }}>Corretora especialista · {IMOVEL.bairro}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input placeholder="Seu nome" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: B.white, padding: '12px 14px', fontSize: 13, fontFamily: B.sans, outline: 'none' }} />
              <input placeholder="WhatsApp" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: B.white, padding: '12px 14px', fontSize: 13, fontFamily: B.sans, outline: 'none' }} />
              <textarea rows={3} defaultValue={`Tenho interesse no imóvel "${IMOVEL.titulo}". Gostaria de agendar uma visita.`}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: B.white, padding: '12px 14px', fontSize: 13, fontFamily: B.sans, outline: 'none', resize: 'none' }} />
              <button style={{
                backgroundColor: B.terra, border: 'none', color: B.white, cursor: 'pointer',
                fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: B.sans, padding: '14px', marginTop: 4,
              }}>Falar com a corretora</button>
            </div>
          </div>
        </aside>
      </div>

      {/* ── IMÓVEIS SEMELHANTES ─────────────────────────────── */}
      <section style={{ backgroundColor: B.white, padding: `${isMobile ? 48 : 72}px ${sidePad}px` }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0, justifyContent: 'space-between', marginBottom: isMobile ? 28 : 36 }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: B.terra, fontFamily: B.sans, fontWeight: 600, marginBottom: 8 }}>Você também pode gostar</p>
            <h2 style={{ fontFamily: B.serif, fontWeight: 300, fontSize: isMobile ? 22 : 28, color: B.navy, letterSpacing: '0.01em' }}>Imóveis semelhantes em Londrina</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 32 : 32 }}>
          {SEMELHANTES.map(p => <SimilarCard key={p.titulo} p={p} />)}
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
