# Inglaterra Premium — Especificação Técnica do Site
**Documento para uso como briefing no Codex** · v1.1 · Ago/2026

> Atualizado com o Manual de Marca oficial (Imageria) — paleta, tipografia e regras de uso do logo já incorporadas na seção 3.

---

## 1. Objetivo do projeto

Site institucional + portal de busca de imóveis para a **Inglaterra Premium**, unidade de alto padrão do Grupo Inglaterra, com:

- Vitrine exclusiva de imóveis premium (não todo o estoque do Grupo)
- Padrão de mercado de luxo (referência: Coelho da Fonseca)
- Excelente desempenho técnico: SEO, AEO, GEO e velocidade
- Atualização automática por Importação XML de fonte externa, com Kenlo/ValueGaia apenas como fonte inicial/legada

---

## 2. Decisão de arquitetura (resumo executivo)

> **Divisão de responsabilidades — importante:** o protótipo em desenvolvimento no Figma Make (React + Vite) é **referência visual e de conteúdo**, usado para aprovação de layout com a diretoria. A implementação técnica real do site — Next.js, pipeline de dados, SEO/AEO/GEO técnico (meta tags, JSON-LD, sitemap) — é construída no Codex seguindo a arquitetura abaixo, **não** o código gerado pelo Figma Make (que é Vite/SPA, sem SSR, inadequado para produção pelos motivos da seção 7).

| Camada | Escolha recomendada | Por quê |
|---|---|---|
| Frontend/Framework | **Next.js 15 (App Router) + TypeScript + Tailwind CSS** | Melhor stack para SEO (SSR/SSG/ISR nativo), performance, e é o que Codex escreve com mais qualidade e previsibilidade |
| Banco de dados | **Postgres gerenciado (Supabase ou Neon)** | Não usar o XML como fonte ao vivo — precisamos de um banco intermediário (explico no item 4) |
| Hospedagem do site | **Vercel** | Integração nativa com Next.js, CDN global, cache de imagem automático, preview deploys, ótimo Core Web Vitals "de fábrica" |
| Armazenamento de imagens | **Cache próprio via Vercel Image Optimization**, apontando para URLs de imagem do fornecedor XML quando disponíveis, ou Supabase/Vercel Blob se quiser independência total do CRM de origem | Evita reprocessar/re-hospedar milhares de fotos sem necessidade |
| Importação XML / sincronização de fonte externa | **Cron job (Vercel Cron ou Supabase Edge Function) rodando a cada 3–6h** puxando XML de um fornecedor, parseando por adaptador, normalizando para contrato interno, filtrando e gravando no Postgres | Desacopla o site da disponibilidade/latência do XML e evita dependência estrutural de um CRM específico |
| Domínio | `https://admin.inglaterrapremium.com` para o CRM/admin; domínio público do site apontado para a Vercel | Decisão do domínio do CRM resolvida; DNS via registros A/CNAME conforme a Vercel indicar |

Essa é essencialmente a mesma arquitetura usada por portais imobiliários modernos de alto padrão (headless: dado separado da apresentação).

---

## 3. Identidade visual (Manual de Marca oficial)

O conceito da marca é **sofisticação, atemporalidade e exclusividade** — símbolo geométrico inspirado na leitura contemporânea de Londrina, tipografia exclusiva no logotipo (traços finos, sem excesso). Isso deve guiar todas as decisões de UI: densidade de informação moderada, muito espaço em branco, sem elementos "gritantes".

### 3.1 Paleta oficial → tokens para o site

| Uso | Pantone | Hex | Papel no site |
|---|---|---|---|
| Primária / texto principal / header | 532 C | `#101a26` | Fundo de header/footer, texto principal, elementos de destaque institucional |
| Accent / CTA | 7610 C | `#51210d` | Botões primários, links ativos, detalhes de destaque (usar com moderação — é uma cor "terracota" forte) |
| Accent claro (terra-light) | — | `#d98a4e` | Uso restrito a texto sobre fundo escuro — o terracota puro (`#51210d`) falha em contraste nesse caso |
| Secundária / apoio | 2471 C | `#998376` | Fundos suaves, bordas, tags, elementos secundários |
| Neutra escura | 426 C | `#1e1e1e` | Texto de corpo sobre fundo claro, alternativa ao preto puro |
| Base clara (offwhite) | — | `#F5F3F0` | Fundo padrão das páginas — **nunca branco puro** |

```css
:root {
  --color-primary: #101a26;     /* Pantone 532 C */
  --color-accent: #51210d;      /* Pantone 7610 C */
  --color-accent-light: #d98a4e;
  --color-secondary: #998376;   /* Pantone 2471 C */
  --color-ink: #1e1e1e;         /* Pantone 426 C */
  --color-bg: #F5F3F0;
}
```

**Regra de uso**: o fundo padrão de todas as páginas é o offwhite `#F5F3F0` — nunca branco puro (`#FFFFFF`), que quebra a leveza e sofisticação pedidas pelo manual. Reserve o `#101a26` para blocos de destaque (hero, footer, cards de "prova social"), como já aparece nas peças do manual (fundo escuro + logo branco). Use `#d98a4e` apenas para texto/detalhes sobre fundo escuro, já que o terracota puro (`#51210d`) não tem contraste suficiente nesse contexto.

### 3.2 Tipografia

- **Logotipo**: fonte exclusiva, **somente para a marca** — não existe alfabeto completo, então **nunca usar essa fonte como corpo de texto**. Ela deve existir no site só como o arquivo do logo (SVG/imagem), não como `font-family` do conteúdo.
- **Tipografia secundária oficial: DM Sans** — esta sim é a fonte de uso geral do site (headings de conteúdo, corpo de texto, botões, formulários).

```css
/* DM Sans via next/font/google — self-hosted, sem bloqueio de renderização */
--font-primary: 'DM Sans', system-ui, sans-serif;
```

Hierarquia sugerida (usando só DM Sans, com peso variando):
- H1: DM Sans 600, tamanhos generosos, `--color-primary` ou `--color-ink`
- H2/H3: DM Sans 500
- Corpo: DM Sans 400, `--color-ink` sobre fundo claro
- Botões/CTA: DM Sans 600, caixa alta com leve letter-spacing (o manual usa versaletes/caixa alta com espaçamento no "PREMIUM" do logo — vale repetir esse recurso em rótulos e categorias, não no corpo de texto)

### 3.3 Regras de aplicação do logo (do manual, traduzidas para web)

- **Versão preferencial**: vertical (símbolo sobre "INGLATERRA PREMIUM"). Usar no header mobile, splash, redes sociais.
- **Versão horizontal**: símbolo ao lado do nome — ideal para o **header desktop** (cabe melhor em barras horizontais estreitas).
- **Versão reduzida ("INGLT")**: para favicon, avatar de redes sociais, espaços muito pequenos (ex. ícone de app).
- **Área de reserva**: manter espaço livre ao redor do logo equivalente a 8x a espessura de referência do símbolo — não encostar menu, texto ou outros elementos nessa margem.
- **Redução mínima**: não exibir o logo abaixo de ~25mm (vertical) / 39mm (horizontal) em impressos; no digital, equivalente aproximado é não renderizar abaixo de ~90px de largura (horizontal) para preservar legibilidade da tipografia fina.
- **Nunca**: distorcer, alterar proporções, remover elementos, alterar espaçamento interno, ou aplicar a versão colorida/PB sobre fundos que não deem contraste suficiente (o manual mostra explicitamente esse erro sobre fundo azul-marinho — evitar logo escuro sobre fundo escuro sem contraste real).
- **Versão negativa** (logo branco): usar sobre `--color-primary` (#101a26) ou imagens escuras — é a combinação testada no manual.

### 3.4 Diretriz de imagens (fotografia)

As peças do manual usam fotografia de **arquitetura/interiores contemporâneos, tons terrosos e naturais, luz suave** — nada de imagens genéricas de banco de imagens "corporativo". Para o site:
- Fotos de imóveis devem manter tratamento de cor consistente (evitar mistura de fotos muito saturadas com fotos neutras).
- Imagens institucionais (hero da home, páginas de bairro) devem seguir essa linha estética: ambientes reais, luz natural, paleta terrosa/neutra — coerente com a paleta oficial.

---

## 4. Por que não consumir o XML "ao vivo" no site

Pontos importantes:

1. **Performance**: XMLs de estoque completo de um CRM fornecedor podem ter centenas de imóveis e vários MB. Parsear isso a cada visita do usuário destrói o tempo de carregamento.
2. **Confiabilidade**: se o XML externo cair ou demorar, seu site cai/trava junto.
3. **SEO**: motores de busca precisam de páginas estáveis, com URLs fixas por imóvel, indexáveis e cacheáveis. Isso só funciona bem com um banco de dados próprio.
4. **Curadoria "premium"**: o filtro (valor + bairro, e outros critérios que você quiser adicionar depois) precisa rodar em algum lugar — o lugar certo é no pipeline de sincronização, não no navegador do usuário.

**Fluxo correto:**

```
Fonte XML externa (Kenlo/ValueGaia como fonte inicial/legada)
   ↓ (cron a cada 3-6h)
Serviço de importação XML (adaptador do fornecedor + contrato interno normalizado + filtro premium)
   ↓
Banco de dados Postgres (catálogo interno e curadoria)
   ↓
Next.js (gera/atualiza páginas via ISR)
   ↓
Site publicado na Vercel (cache + CDN)
```

---

## 5. Critério de filtragem "Premium"

Você indicou: **valor mínimo + lista de bairros**. Recomendo estruturar assim (fácil de editar sem mexer no código):

```json
{
  "criterios_premium": {
    "valor_minimo_venda": 1200000,
    "valor_minimo_locacao": 6000,
    "bairros_permitidos": [
      "Gleba Palhano",
      "Country Club",
      "Bairro X",
      "Bairro Y"
    ],
    "regra": "E (bairro E valor) OU (tag manual 'destaque_premium' = true)"
  }
}
```

**Recomendações adicionais:**
- Manter esses critérios em uma **tabela de configuração no banco** (não hardcoded), editável por um painel simples ou até por uma planilha sincronizada — assim a equipe comercial ajusta sem depender de desenvolvedor.
- Incluir um **campo de override manual** (`is_premium_override: true/false`) por imóvel, para a curadoria da equipe corrigir casos de borda (imóvel abaixo do valor mas estrategicamente premium, ou o contrário).
- Logar quantos imóveis entraram/saíram do filtro em cada sincronização, para detectar XML quebrado ou mudanças bruscas.

---

## 6. Estrutura do site (v2 — validada com a diretoria)

### 6.1 Mapa de páginas

```
/                                          Home
/imoveis                                   Busca guiada (comprar/alugar, filtros)
/imoveis/comprar
/imoveis/alugar
/imoveis/[slug-do-imovel]                  Ficha individual do imóvel

/bts                                       Inglaterra BTS — página única (ver 6.3, não tem listagem/dropdown)
/lancamentos/[slug]                        Página individual de cada lançamento — SEM hub/listagem (ver 6.3)
/condominios/[slug]                        Página individual de cada condomínio — SEM hub/listagem (ver 6.3)

/bairros                                   Hub de bairros premium (SEO local)
/bairros/[nome-do-bairro]                  "Conheça o bairro X" + imóveis daquele bairro

/sobre                                     Institucional — 25 anos, Grupo Inglaterra, diretoria
/sobre/diretoria                           Perfil dos 3 diretores (ou seção dentro de /sobre — ver 6.3)

/noticias                                  Blog / central de notícias do mercado
/noticias/[slug]                           Artigo

/seja-corretor                             Recrutamento de corretores
/anuncie-seu-imovel                        Captação de proprietários — "Seu imóvel ainda não está na Inglaterra?"
/investidores                              Atendimento a investidores
/contato
```

> **Mudança importante em relação à v2 original**: Lançamentos e Condomínios **não têm página de listagem/hub**. Cada lançamento e cada condomínio é uma página própria (`/lancamentos/[slug]`, `/condominios/[slug]`), e a navegação entre eles acontece pelo **dropdown do menu principal** (passa o mouse em "Lançamentos" ou "Condomínios" e abre a lista dos ativos no momento, só com o nome). Já prototipamos esse padrão nas páginas `LancamentoDetalhe.tsx` e `PaginaCondominio.tsx`.

### 6.2 O que entra na Home (ordem sugerida)

| # | Seção | Função |
|---|---|---|
| 1 | Hero + busca | Primeira impressão + conversão imediata |
| 2 | Estatísticas (25 anos, imóveis ativos, bairros) | Prova de credibilidade |
| 3 | Imóveis em destaque | Vitrine principal |
| 4 | Bairros | Navegação por região + SEO local |
| 5 | **Produtos da Inglaterra Premium** | 3 cards: Imóveis em Condomínios / Inglaterra BTS / Lançamentos — cada um leva à página própria |
| 6 | **Diretoria** | Bloco institucional com os 3 diretores — nome, cargo, foto, uma frase de posicionamento cada |
| 7 | **Notícias** | 3 matérias mais recentes + link para `/noticias` |
| 8 | Bloco institucional (Inglaterra Antecipa) | Cross-sell para proprietários |
| 9 | **Seja um corretor Inglaterra Premium** | Banner de recrutamento com os 4 diferenciais |
| 10 | **Seu imóvel ainda não está na Inglaterra?** | Formulário de captação de proprietários |
| 11 | **Redes sociais** | Grade com posts recentes do Instagram (embed) |
| 12 | **Newsletter** | Bloco de assinatura — texto fornecido por vocês |
| 13 | Footer | Navegação, contato, CRECI |

Isso é *bastante* conteúdo para uma única página — o risco real aqui é a home virar uma maratona de rolagem. Recomendo tratar os itens 5, 6, 7, 9, 10, 11 e 12 como **prévias curtas** (1 a 3 elementos + "ver mais"), nunca a versão completa — a versão completa mora na página dedicada. Isso mantém a home rápida de navegar e ainda assim cobre todos os pontos.

### 6.3 Detalhes por seção nova

**Produtos da Inglaterra Premium** — 3 produtos, cada um com página própria (sem hub `/produtos` — ver mudança na seção 6.1):
- `/condominios/[slug]` — cada condomínio fechado de alto padrão tem página própria, listada no dropdown "Condomínios" do menu
- `/bts` — **Inglaterra BTS confirmado**: built-to-suit *corporativo*, não para comprador final. Modelo de negócio de dois lados — (1) proprietário de terreno recebe renda garantida por contrato de locação de longo prazo, sem custo de construção; (2) empresa que precisa de um imóvel corporativo (galpão logístico, sede administrativa etc.) recebe o espaço projetado sob medida para sua operação, sem investir capital em construção. A Inglaterra Premium estrutura terreno, projeto, obra e contrato de locação entre as duas partes. Página única, sem listagem/dropdown (não é uma coleção de itens cadastrados).
- `/lancamentos/[slug]` — cada lançamento tem página própria, listada no dropdown "Lançamentos" do menu

**Diretoria** — seção institucional com os 3 diretores. Preciso de: nome, cargo, uma foto profissional de cada, e uma frase curta (não currículo completo — isso é para o site, não para um relatório). Pode morar dentro de `/sobre` como uma seção, com um preview na home.

**Notícias** — este é o motor de conteúdo que mencionei na seção de AEO/GEO do documento técnico (seção 8). Cada notícia deve ser escrita para responder perguntas reais do mercado ("Por que a Gleba Palhano valorizou tanto?", "Vale a pena investir em imóvel na planta em Londrina em 2026?") — isso é o que faz o site ser citado por ferramentas como ChatGPT e Perplexity, além de rankear no Google.

**Redes sociais** — recomendo embed real do Instagram (via API oficial da Meta) em vez de imagens estáticas, para não precisar atualizar manualmente. Precisa de token de acesso da conta comercial do Instagram.

**Seja um corretor Inglaterra Premium** — página de recrutamento com o texto e os 4 diferenciais que você passou:
> Maior e mais atualizado portfólio de imóveis do mercado
> - Escalabilidade com IA
> - Treinamentos constantes
> - Marketing e Inovação como DNA
> - Networking com as maiores referências do setor

Estrutura sugerida da página: hero com a chamada principal → os 4 diferenciais em formato de cards → depoimentos de corretores atuais (se houver) → formulário de candidatura.

**Seu imóvel ainda não está na Inglaterra?** — banner de captação com CTA para um formulário simples (nome, telefone, endereço do imóvel, tipo, uma mensagem). Sugiro deixar esse banner também disponível como componente reutilizável em outras páginas (ficha de imóvel de concorrente não existe, mas pode aparecer na página de bairro, por exemplo).

**Newsletter** — bloco com o texto que você já definiu:
> "Tenha propriedade sobre o mercado imobiliário: assine nossa newsletter. 25 anos de experiência traduzidos em dados, notícias e movimentos do mercado mais vibrante do país."

Precisa de uma ferramenta de e-mail marketing por trás (Mailchimp, RD Station, Brevo etc.) — me avise qual vocês já usam ou pretendem usar, para eu incluir a integração certa no escopo técnico.

**Por que páginas de bairro continuam importantes:** concentram autoridade de SEO local, respondem buscas do tipo "imóveis de luxo no [bairro] Londrina" e são exatamente o tipo de conteúdo que motores de resposta por IA (AEO/GEO) preferem citar, por serem específicas e factuais.

---

## 7. SEO técnico (checklist para o Codex implementar)

- **Renderização**: SSG para páginas institucionais e de bairro; ISR (revalidate a cada poucas horas) para listagem e fichas de imóveis, para acompanhar a Importação XML.
- **URLs**: limpas e permanentes, ex. `/imoveis/casa-alto-padrao-gleba-palhano-4-suites-abc123` (slug + id, nunca reaproveitar URL de imóvel vendido para outro imóvel).
- **Meta tags dinâmicas** por página (title, description, Open Graph, Twitter Card) geradas a partir dos dados do imóvel/bairro.
- **Sitemap.xml** gerado automaticamente (Next.js `sitemap.ts`), atualizado a cada sincronização de fonte externa.
- **robots.txt** liberando crawlers e apontando o sitemap.
- **Dados estruturados (Schema.org / JSON-LD)**:
  - `RealEstateListing` em cada ficha de imóvel
  - `Organization` + `RealEstateAgent` no site
  - `BreadcrumbList` em todas as páginas
  - `FAQPage` nas páginas de bairro/lançamento, quando houver perguntas frequentes
- **Canonical tags** para evitar duplicidade entre filtros de busca.
- **Imagens**: `next/image` com `alt` descritivo (rua/bairro/tipologia), lazy loading nativo, formatos AVIF/WebP.
- **Hierarquia de headings** (H1 único por página, H2/H3 organizados).
- **Core Web Vitals**: meta de LCP < 2.5s, CLS < 0.1, INP < 200ms.

### 7.1 Diretrizes de conteúdo e copy (validadas no protótipo, para o Codex seguir)

Padrões de texto testados e aplicados no protótipo do Figma Make — o Codex deve seguir os mesmos princípios ao gerar o conteúdo real das páginas Next.js:

- **H1 sempre com palavra-chave real**, não só frase de efeito. Ex.: H1 = "Imóveis de alto padrão em Londrina", com a frase de marca ("Onde visão se torna patrimônio") como subtítulo/tagline abaixo — mantém a voz da marca sem sacrificar SEO. Vale para a Home e para todas as páginas de categoria/bairro (`/bairros/[nome]` → H1 = "Imóveis de Alto Padrão em [Bairro], Londrina").
- **Consistência geográfica absoluta**: todo o conteúdo (imóveis de exemplo, estatísticas, rodapé, ticker, textos institucionais) deve referenciar apenas Londrina e seus bairros reais. Nunca misturar com outras cidades/estados — isso dilui SEO local e pode fazer uma IA responder incorretamente sobre a área de atuação da empresa.
- **Frases declarativas no início de cada bloco de texto** (define o termo antes de elaborar) — é o padrão que ChatGPT/Perplexity/AI Overviews preferem citar. Ex.: "Inglaterra BTS: built-to-suit corporativo em Londrina — imóveis projetados e construídos sob medida para a operação de uma empresa, com contrato de locação de longo prazo..." em vez de abrir com adjetivos genéricos.
- **Headings reais em toda seção**, mesmo quando o design não mostra um título visível grande — usar um H2 visualmente discreto (ou visually-hidden para leitores de tela/crawlers) em blocos como estatísticas ou vitrines de imóveis que hoje só têm texto decorativo.
- **Alt text de imagem sempre com contexto geográfico**: `"[Nome do imóvel] — [Bairro], Londrina"`, `"Bairro [Nome], Londrina"` — nunca só o nome próprio isolado.
- **Números e fatos específicos > adjetivos vagos**: prefira "12 bairros de atuação em Londrina" a "presença em toda a região" — dados concretos são o que motores de resposta por IA extraem e citam.

---

## 8. AEO e GEO (otimização para IA/buscadores de resposta)

Isso é o que diferencia um site "só bonito" de um site preparado para 2026 em diante:

1. **Conteúdo factual e extraível**: cada ficha de imóvel e página de bairro deve responder objetivamente "o quê, onde, quanto, quantos" logo nos primeiros parágrafos — modelos de IA (ChatGPT, Perplexity, Gemini, AI Overviews do Google) preferem citar texto direto e verificável, não textos genéricos de marketing.
2. **Arquivo `llms.txt`** na raiz do site: um resumo estruturado do que é o Grupo Inglaterra Premium, principais serviços e páginas-chave, no formato que agentes de IA já sabem ler.
3. **FAQ real** em páginas estratégicas (bairros, lançamentos, "como comprar imóvel de alto padrão em Londrina") com perguntas que pessoas realmente fazem a chatbots — isso alimenta o `FAQPage` schema também.
4. **Consistência de NAP** (Nome, Endereço, Telefone) idêntica em todo o site, Google Business Profile e portais parceiros — motores de resposta cruzam essas fontes para validar confiabilidade.
5. **Conteúdo evergreen sobre o mercado** (blog leve): "Como está o mercado de alto padrão em Londrina", "Bairros mais valorizados", etc. — gera citações em respostas de IA sobre a região, o que hoje é praticamente impossível de conseguir só com fichas de imóveis.
6. **Velocidade de indexação**: como o conteúdo é gerado via ISR, notificar o Google (IndexNow API) a cada atualização relevante para acelerar re-rastreamento.

---

## 9. Performance

- Hospedagem em edge (Vercel) com cache agressivo de páginas estáticas/ISR.
- Imagens otimizadas automaticamente (tamanho por breakpoint, formato moderno).
- Fontes com `next/font` (self-hosted, sem bloqueio de renderização).
- JavaScript mínimo no cliente — a busca de imóveis pode ser majoritariamente server-side (filtros via query string, não client-state pesado).
- Meta de Lighthouse: 90+ em Performance, SEO e Acessibilidade.

---

## 10. Hospedagem, domínio e passo a passo de publicação

1. **Domínio**: CRM/admin confirmado em `https://admin.inglaterrapremium.com`; domínio público do site configurado no projeto Vercel correto.
2. **Banco de dados**: criar projeto no Supabase (ou Neon) — plano gratuito é suficiente para começar, com upgrade simples depois.
3. **Repositório de código**: GitHub (o Codex trabalha integrado a repositórios Git; a Vercel faz deploy automático a cada push).
4. **Deploy**: conectar o repositório GitHub à Vercel → deploy automático a cada alteração aprovada.
5. **Variáveis de ambiente** (chaves de banco, URL da fonte XML externa e credenciais de serviços) configuradas direto no painel da Vercel — nunca no código.
6. **Certificado SSL**: automático pela Vercel.
7. **Ambiente de homologação**: a Vercel já gera automaticamente uma URL de preview para cada alteração antes de ir ao ar — útil para revisar antes de publicar.

---

## 11. Plano de implementação (fases sugeridas para o Codex)

**Fase 1 — Fundação**
- Setup do projeto Next.js + TypeScript + Tailwind
- Modelagem do banco (tabela `imoveis`, `bairros`, `configuracoes_premium`, `sincronizacoes_log`)
- Script de Importação XML: buscar XML da fonte externa inicial/legada → parsear por adaptador → normalizar para contrato interno → aplicar filtro premium → upsert no banco

**Fase 2 — Páginas principais**
- Home, listagem de imóveis com filtros, ficha de imóvel
- Sitemap, robots.txt, metadata dinâmica, JSON-LD

**Fase 3 — Conteúdo institucional**
- Sobre, Investidores, Anuncie seu imóvel, Contato, páginas de bairro

**Fase 4 — AEO/GEO e refinamento**
- FAQ, llms.txt, blog (se aprovado), IndexNow
- Auditoria de performance (Lighthouse) e ajustes finais

**Fase 5 — QA e publicação**
- Revisão de conteúdo, teste em dispositivos móveis, configuração de domínio, go-live

---

## 12. O que ainda preciso de você

- [x] ~~IDV em anexo~~ — recebida e incorporada na seção 3
- [x] ~~Estrutura de páginas e seções~~ — definida na seção 6
- [x] ~~Confirmar o significado de "Inglaterra BTS"~~ — built-to-suit corporativo (terreno → locação de longo prazo para empresa), ver seção 6.3
- [x] ~~Nome, cargo, foto e frase de posicionamento dos 3 diretores~~ — Wagner Lopes Redon (Locação), Luis Carlos Itakura (Administrativo), Vanderson Lopes Redon (Vendas); fotos reais recebidas; frases atuais são ilustrativas, pendente texto final
- [ ] Ferramenta de e-mail marketing para a newsletter (Mailchimp, RD Station, Brevo etc.)
- [ ] Acesso à conta comercial do Instagram (para embed real de posts)
- [ ] Confirmar valor mínimo e lista de bairros para o filtro premium
- [ ] Acesso/documentação da URL XML da fonte externa inicial/legada (Kenlo/ValueGaia no primeiro adaptador)
- [ ] Definir se o "Inglaterra Antecipa" deve aparecer neste site ou só no site da Imobiliária tradicional
- [x] ~~Confirmar domínio do CRM/admin~~ — definido como `https://admin.inglaterrapremium.com`
- [ ] Decidir se a busca por IA da Home/Busca usa modelo de linguagem real já na v1, ou só filtros manuais (ver plano-implementacao-codex.md, Fase 3.2)

---

*Este documento pode ser colado diretamente como prompt inicial no Codex, seção por seção, para gerar o projeto de forma estruturada. Recomenda-se anexar também o PDF original do Manual de Marca ao Codex, para referência visual direta (o Codex consegue ler logos e paletas de imagens/PDFs ao gerar componentes).*
