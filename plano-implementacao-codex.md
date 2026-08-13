# Inglaterra Premium — Plano de Implementação com o Codex
**Da prototipagem (Figma Make) à produção (Next.js)** · v1.0 · Ago/2026

> Este documento é o roteiro de execução. Para arquitetura técnica completa (stack, banco de dados, filtro premium, SEO/AEO/GEO), consulte `inglaterra-premium-spec-tecnica.md` — os dois documentos se complementam.

---

## Por que um plano em fases (e não "constrói o site inteiro")

Pedir pro Codex "construir o site inteiro" de uma vez é a receita pro loop infinito: ele reescreve componentes de formas diferentes a cada prompt, perde consistência de design, e fica difícil saber o que já está pronto e o que ainda falta.

A regra de ouro aqui é: **um prompt, um objetivo, uma revisão antes de avançar.** Cada fase abaixo termina com algo que você consegue *ver e aprovar* antes de seguir pra próxima.

---

## O que você já tem pronto (referência para o Codex)

| Arquivo | O que é |
|---|---|
| `inglaterra-premium-spec-tecnica.md` | Arquitetura técnica completa — stack, banco, filtro premium, SEO |
| `App.tsx` | Home — protótipo visual completo |
| `BuscaImoveis.tsx` | Busca de imóveis — protótipo visual completo |
| `FichaImovel.tsx` | Ficha do imóvel — protótipo visual completo |
| `PaginaBairro.tsx` | Página de bairro — protótipo visual completo |
| `LancamentoDetalhe.tsx` | Página individual de lançamento — protótipo visual completo |
| `PaginaCondominio.tsx` | Página individual de condomínio — protótipo visual completo |
| `PaginaBTS.tsx` | Página do produto BTS — protótipo visual completo |
| `logo-navy.png` / `logo-white.png` | Logo real, duas versões |
| `diretor-wagner.jpg` / `diretor-luis.jpg` / `diretor-vanderson.jpg` | Fotos reais dos 3 diretores |
| `capa-hero.jpg` | Foto de capa real do hero |

**Importante**: os arquivos `.tsx` acima são protótipos do Figma Make (React + Vite, sem SSR). Servem como **referência visual e de conteúdo exata** — não são o código de produção. O Codex vai recriá-los em Next.js seguindo a arquitetura do documento técnico.

---

## Estrutura de pastas do projeto (Next.js)

Isso é o que o Codex deve criar/seguir — vale colar junto no prompt da Fase 1 pra ele não inventar uma organização diferente.

```
inglaterra-premium/
├── app/
│   ├── layout.tsx                      # Layout raiz — fontes (DM Sans), <html>, metadata padrão
│   ├── page.tsx                        # Home                            ← App.tsx
│   ├── globals.css                     # Reset + tokens CSS (cores, fundo bege)
│   │
│   ├── imoveis/
│   │   ├── page.tsx                    # Busca de imóveis                ← BuscaImoveis.tsx
│   │   └── [slug]/
│   │       └── page.tsx                # Ficha do imóvel                 ← FichaImovel.tsx
│   │
│   ├── bairros/
│   │   ├── page.tsx                    # Hub de bairros
│   │   └── [slug]/
│   │       └── page.tsx                # Página de bairro                ← PaginaBairro.tsx
│   │
│   ├── lancamentos/
│   │   └── [slug]/
│   │       └── page.tsx                # Página individual de lançamento ← LancamentoDetalhe.tsx
│   │                                      (sem hub — navegação via dropdown do Header)
│   │
│   ├── condominios/
│   │   └── [slug]/
│   │       └── page.tsx                # Página individual de condomínio ← PaginaCondominio.tsx
│   │                                      (sem hub — navegação via dropdown do Header)
│   │
│   ├── bts/
│   │   └── page.tsx                    # Inglaterra BTS (página única)   ← PaginaBTS.tsx
│   │
│   ├── sobre/
│   │   ├── page.tsx                    # Institucional + diretoria
│   │   └── diretoria/
│   │       └── page.tsx                # (se virar página própria em vez de seção)
│   │
│   ├── noticias/
│   │   ├── page.tsx                    # Listagem de notícias
│   │   └── [slug]/
│   │       └── page.tsx                # Artigo
│   │
│   ├── seja-corretor/
│   │   └── page.tsx
│   ├── anuncie-seu-imovel/
│   │   └── page.tsx
│   ├── investidores/
│   │   └── page.tsx
│   ├── contato/
│   │   └── page.tsx
│   │
│   ├── sitemap.ts                      # Fase 6
│   ├── robots.ts                       # Fase 6
│   └── api/
│       └── sync-kenlo/
│           └── route.ts                # Endpoint chamado pelo cron job (Fase 2)
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx                  # Nav + dropdowns Lançamentos/Condomínios + menu mobile
│   │   └── Footer.tsx
│   ├── ui/
│   │   ├── Button.tsx                  # btn-solid / btn-line / btn-rust do protótipo
│   │   ├── Pill.tsx                    # chips de filtro (bairro, tipo, suítes)
│   │   ├── PropertyCard.tsx            # card de imóvel — reusado em Home/Busca/Bairro/Ficha
│   │   ├── SectionEyebrow.tsx          # o padrão "linha + texto uppercase" repetido em toda página
│   │   └── ContactForm.tsx             # formulário reusado (ficha, lançamento, condomínio, BTS)
│   └── search/
│       └── AiSearchBar.tsx             # busca por IA da Home/Busca (Fase 3.2)
│
├── lib/
│   ├── db.ts                           # cliente do banco (Supabase/Neon)
│   ├── kenlo-sync.ts                   # parser do XML + filtro premium (Fase 2)
│   ├── queries/
│   │   ├── imoveis.ts
│   │   ├── bairros.ts
│   │   ├── lancamentos.ts
│   │   └── condominios.ts
│   └── seo.ts                          # helpers de metadata/JSON-LD (Fase 6)
│
├── public/
│   └── images/
│       ├── logo-navy.png               ← já entregue
│       ├── logo-white.png              ← já entregue
│       ├── capa-hero.jpg               ← já entregue
│       └── diretoria/
│           ├── wagner.jpg              ← já entregue
│           ├── luis.jpg                ← já entregue
│           └── vanderson.jpg           ← já entregue
│
├── tailwind.config.ts                  # tokens de cor/fonte extraídos do objeto B dos protótipos
├── next.config.ts
└── package.json
```

**Duas decisões embutidas nessa estrutura, pra não se perder depois:**
- `PropertyCard`, `Button`, `Pill` e `ContactForm` viram componentes únicos em `components/ui/`, reaproveitados entre páginas — no protótipo cada arquivo `.tsx` duplicava esses pedaços (normal em Figma Make, errado em produção). É exatamente esse tipo de duplicação que a Fase 1 deve eliminar.
- Lançamentos e Condomínios não têm pasta de listagem (`page.tsx` direto em `/lancamentos`) — só a rota dinâmica, porque não existe hub, conforme a seção 6.1 do documento técnico.

---

## Fase 0 — Preparação (tudo no GitHub, nada local)

Você não precisa de nada instalado na sua máquina — o Codex tem uma versão **Cloud** que conecta direto num repositório do GitHub, trabalha num ambiente isolado na nuvem, roda testes, e devolve o resultado como Pull Request pra você revisar e aprovar. Todo o resto da stack que já escolhemos (Vercel, Supabase/Neon) também é 100% cloud — então dá pra tocar o projeto inteiro de qualquer computador, só logando nos serviços.

Como as peças se encaixam:

| Peça | Onde mora | Nada local necessário |
|---|---|---|
| Código-fonte | Repositório no GitHub | ✅ |
| Execução do Codex | Codex Cloud (dentro do ChatGPT, conectado ao GitHub) | ✅ — clona o repo, trabalha isolado, abre PR |
| Deploy | Vercel, conectado ao GitHub — publica automático a cada merge | ✅ |
| Banco de dados | Supabase ou Neon (Postgres gerenciado) | ✅ |
| Revisão/edição pontual sem abrir o Codex | Editor web do GitHub, ou GitHub Codespaces (VS Code no navegador) | ✅ |

Passo a passo desta fase:

1. **Crie o repositório no GitHub** (vazio, privado) — ex. `inglaterra-premium`
2. **No ChatGPT, ative o Codex Cloud** (Settings → Codex) e conecte sua conta do GitHub
3. **Crie um "environment"** no Codex apontando pro repositório que você acabou de criar — é isso que permite disparar tarefas nele
4. **Escreva um arquivo `AGENTS.md`** na raiz do repositório *antes* do primeiro prompt — é onde o Codex lê as convenções do projeto (isso é diferente do `AGENTS.md` que o Figma Make gera automaticamente; aqui você escreve o seu, resumindo a stack, os comandos de teste/build, e apontando pra `inglaterra-premium-spec-tecnica.md` e `plano-implementacao-codex.md` como fonte de verdade)
5. **Suba os dois documentos + os arquivos `.tsx` dos protótipos + as imagens reais** (logo, fotos dos diretores, capa) pro repositório — o Codex Cloud só enxerga o que está no repo, então tudo que ele precisa ler como referência tem que estar lá dentro, não só anexado numa conversa
6. **Conecte a Vercel ao mesmo repositório** (deploy automático a cada push/merge — a Vercel te dá uma URL de preview pra cada Pull Request antes de ir pra produção)
7. **Crie o projeto no Supabase ou Neon** — nenhum dos dois exige nada local, é tudo configurado pelo painel web

A partir daqui, seu fluxo de trabalho de qualquer lugar vira: abrir o Codex no navegador (ou no app do ChatGPT) → mandar o prompt da fase → ele trabalha isolado na nuvem → te devolve um Pull Request → você revisa o preview da Vercel → aprova e o merge dispara o deploy. Nunca precisa clonar nada localmente.

Coisas que travam o desenvolvimento se não estiverem prontas:

- [ ] Repositório GitHub criado, com `AGENTS.md` na raiz
- [ ] Codex Cloud conectado ao repositório (environment criado)
- [ ] Projeto criado na Vercel, conectado ao mesmo repositório
- [ ] Banco Postgres criado (Supabase ou Neon) — só o projeto, schema vem na Fase 2
- [ ] Domínio com acesso ao DNS em mãos
- [ ] URL do XML da Kenlo em mãos (a Kenlo fornece um link único por conta)
- [ ] Confirmar critério final do filtro premium: valor mínimo + lista de bairros
- [ ] Frases reais dos 3 diretores (as atuais são ilustrativas)
- [ ] Ferramenta de e-mail marketing definida (pro formulário de newsletter/lançamentos)

**Você não precisa ter todos os itens acima 100% prontos pra começar** — mas cada um que faltar vai pausar uma fase específica lá na frente. Vale revisar essa lista agora.

---

## Fase 1 — Fundação técnica (scaffold + design system)

**Objetivo único desta fase**: uma página em branco no Next.js com header e footer *idênticos* ao protótipo, publicada na Vercel. Nada de conteúdo de página ainda.

Prompt sugerido pro Codex (adaptar):
> "Crie um projeto Next.js 15 (App Router) + TypeScript + Tailwind CSS. Vou te passar um arquivo de protótipo React (`App.tsx`) que tem os tokens de cor, tipografia (DM Sans) e os componentes de Header e Footer que preciso que você recrie fielmente como componentes compartilhados (`components/Header.tsx`, `components/Footer.tsx`), usando Tailwind em vez de inline styles. Não crie nenhuma página de conteúdo ainda — só o layout base com Header e Footer funcionando, incluindo o menu mobile com hambúrguer e os dropdowns de Lançamentos/Condomínios no Header."

O que revisar antes de aprovar esta fase:
- Fundo bege (não branco), fonte DM Sans, cores batendo com a paleta (`#101a26`, `#51210d`, `#d98a4e`, `#998376`)
- Menu mobile com hambúrguer funcionando
- Dropdowns de Lançamentos/Condomínios abrindo no hover (desktop) e como sanfona (mobile)
- Logo real aparecendo (upload os arquivos `.png` no projeto)

**Não avance pra Fase 2 até essa base estar visualmente idêntica ao protótipo.** Ela vai ser reutilizada em toda página daqui pra frente — qualquer inconsistência aqui se multiplica depois.

---

## Fase 2 — Banco de dados + pipeline do XML

**Objetivo único**: dados reais da Kenlo entrando no banco, filtrados por premium, sem nenhuma página ainda consumindo isso.

Passos:
1. Criar o schema no banco: tabelas `imoveis`, `bairros`, `lancamentos`, `condominios`, `configuracoes_premium`, `sincronizacoes_log` (estrutura sugerida na seção 5 do documento técnico)
2. Criar o script de sincronização (cron job via Vercel Cron): busca o XML da Kenlo → parseia → aplica filtro premium (valor + bairro, configurável na tabela `configuracoes_premium`) → grava no banco
3. Rodar manualmente uma vez e conferir: os imóveis que caíram no banco batem com o que você esperava?

O que revisar antes de aprovar esta fase:
- Rodar uma consulta simples no banco e ver imóveis reais de Londrina, já filtrados
- Confirmar que imóveis fora do critério premium **não** entraram
- Log de sincronização mostrando quantos imóveis entraram/saíram

---

## Fase 3 — Páginas principais (uma por vez)

Cada página abaixo é **um prompt separado**, nessa ordem. Para cada uma: dê o arquivo `.tsx` do protótipo como referência visual e peça pro Codex portar fielmente, usando os componentes compartilhados da Fase 1 e os dados reais da Fase 2 no lugar dos dados de exemplo.

| Ordem | Página | Referência | Fonte de dados |
|---|---|---|---|
| 3.1 | Home | `App.tsx` | Tabela `imoveis` (destaques), `bairros`, textos institucionais fixos |
| 3.2 | Busca de imóveis | `BuscaImoveis.tsx` | Tabela `imoveis` com filtros |
| 3.3 | Ficha do imóvel | `FichaImovel.tsx` | Tabela `imoveis`, rota dinâmica `/imoveis/[slug]` |
| 3.4 | Página de bairro | `PaginaBairro.tsx` | Tabela `bairros` + `imoveis` filtrados, rota `/bairros/[slug]` |

Prompt-modelo pra cada página:
> "Aqui está o protótipo visual da [nome da página] (`arquivo.tsx`). Recrie essa página em `app/[rota]/page.tsx`, usando os componentes Header/Footer que já existem no projeto, mantendo fielmente o layout, cores e tipografia. Troque os dados de exemplo por uma consulta real à tabela [tabela] do banco. Aplique metadata dinâmica (title, description) conforme a seção 7 do documento técnico."

**Pausa de revisão obrigatória depois de cada página** — confira mobile e desktop antes de pedir a próxima.

⚠️ **Ponto de atenção na Busca**: a busca por IA que construímos no protótipo é uma simulação (parser de texto simples). Decida antes desta fase: vocês querem uma IA de verdade (chamada a um modelo de linguagem) já nesta primeira versão, ou lançam com os filtros manuais funcionando e adicionam a IA depois? Isso muda o escopo do prompt.

---

## Fase 4 — Páginas de produto

Mesma lógica da Fase 3, mas para os 3 produtos:

| Ordem | Página | Referência | Observação |
|---|---|---|---|
| 4.1 | Hub + páginas de Lançamentos | `LancamentoDetalhe.tsx` | Rota dinâmica `/lancamentos/[slug]`; a lista que alimenta o dropdown do menu vem da mesma tabela |
| 4.2 | Hub + páginas de Condomínios | `PaginaCondominio.tsx` | Rota dinâmica `/condominios/[slug]`; mesmo padrão de dropdown |
| 4.3 | Página do BTS | `PaginaBTS.tsx` | Página única, sem rota dinâmica — é um serviço, não uma lista |

---

## Fase 5 — Páginas institucionais (ainda não prototipadas)

Estas ainda não têm protótipo visual — vão ser desenhadas e construídas direto nesta fase, ou (recomendado) prototipadas primeiro comigo antes de ir pro Codex, pra manter o mesmo processo de revisão:

- Sobre / Diretoria
- Notícias (listagem + artigo)
- Seja Corretor
- Anuncie seu Imóvel (captação de proprietários)
- Investidores
- Contato

---

## Fase 6 — SEO técnico

Só depois que as páginas de conteúdo já existirem:

- Metadata API por rota (title/description únicos)
- `sitemap.ts` gerado automaticamente
- `robots.txt`
- JSON-LD: `RealEstateListing` (imóveis), `Organization`, `BreadcrumbList`, `FAQPage` (bairros/produtos)
- `llms.txt` na raiz
- Open Graph images

---

## Fase 7 — QA, performance e go-live

- Lighthouse (meta: 90+ em Performance/SEO/Acessibilidade)
- Teste real em dispositivos móveis
- Configuração de DNS do domínio
- SSL (automático pela Vercel)
- Publicação

---

## Regras práticas pra não entrar em loop com o Codex

1. **Um prompt, um objetivo.** Nunca peça "ajusta tudo" — aponte o arquivo e o problema específico.
2. **Revise antes de avançar de fase.** Se a Fase 1 não está pixel-perfect, corrigir isso na Fase 4 é 3x mais trabalho.
3. **Sempre referencie o arquivo do protótipo**, não descreva de memória — evita o Codex "reinventar" o design a cada prompt.
4. **Commits pequenos e frequentes.** Cada página aprovada = um commit. Se algo quebrar depois, dá pra voltar sem perder tudo.
5. **Nunca deixe o Codex decidir arquitetura sozinho.** As decisões de stack, banco e estrutura já estão nos dois documentos — o trabalho dele é executar, não redesenhar.
6. **Se o Codex sugerir mudar algo do design system**, traga de volta pra mim antes de aceitar — mantemos a mesma fonte de verdade em tudo.

---

*Ordem recomendada de leitura pro Codex, no início de cada sessão nova: `inglaterra-premium-spec-tecnica.md` → este documento → o arquivo `.tsx` da página específica sendo trabalhada naquele momento.*
