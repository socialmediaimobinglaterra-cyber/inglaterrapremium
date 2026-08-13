# AGENTS.md — Inglaterra Premium

Este arquivo é lido pelo Codex antes de qualquer tarefa neste repositório. As instruções aqui têm prioridade sobre suposições que você faria por conta própria.

## Leia primeiro, sempre

Antes de começar qualquer tarefa, leia nesta ordem:
1. `docs/inglaterra-premium-spec-tecnica.md` — arquitetura técnica, stack, banco de dados, filtro premium, SEO/AEO/GEO
2. `docs/plano-implementacao-codex.md` — estrutura de pastas do projeto, fases de implementação, critérios de aceite
3. O(s) arquivo(s) específico(s) da pasta `prototypes/` relevante(s) para a tarefa do momento

Essas fontes já contêm as decisões de arquitetura, design e estrutura do projeto. Não redecida stack, banco, rotas ou design por conta própria — seu papel é executar o que já está documentado.

## O que é este projeto

Site institucional + portal de imóveis de alto padrão da Inglaterra Premium, em Londrina/PR. Next.js 15 (App Router) + TypeScript + Tailwind CSS, banco Postgres (Supabase/Neon), dados de imóveis sincronizados via XML da Kenlo.

## O que é a pasta `prototypes/`

Contém protótipos visuais em React + Vite (gerados no Figma Make) — **referência visual e de conteúdo exata**, não código de produção. Cada arquivo `.tsx` ali usa estilos inline e duplica Header/Footer entre si (padrão aceitável em protótipo, não em produção). Ao portar para Next.js:
- Recrie o visual com fidelidade (cores, tipografia, espaçamento, textos)
- Converta estilos inline para Tailwind
- Extraia Header, Footer e componentes repetidos (`PropertyCard`, `Button`, `Pill`, `ContactForm`) para `components/`, reutilizados entre páginas — nunca duplicados
- Troque dados de exemplo por consultas reais ao banco

## Design system (não alterar sem aprovação)

- Cores: `#101a26` (navy/primária), `#51210d` (terra/accent), `#d98a4e` (terra-light — só para texto sobre fundo escuro, terra puro falha em contraste), `#998376` (sand/secundária), `#F5F3F0` (offwhite — fundo padrão das páginas, **nunca branco puro** como fundo de página)
- Tipografia: **somente DM Sans** em todo o conteúdo. Nenhuma outra fonte, nem serifada — a fonte exclusiva da marca é restrita ao logotipo (arquivo de imagem, não CSS)
- Títulos grandes usam peso 300 (leve), não 400/700
- Fundo de página é sempre bege (`#F5F3F0`), nunca branco

## Regras de execução

- Um objetivo por tarefa. Não expanda escopo além do que foi pedido nesta tarefa específica.
- Não redesenhe layout, cores ou tipografia que já existem nos protótipos.
- Se um dado necessário não existir no banco ou nos documentos (ex: campo usado no protótipo sem fonte clara), pergunte antes de inventar ou improvisar.
- Ao terminar, resuma o que foi feito, o que ficou conectado a dados reais vs. o que continua fixo/placeholder, e qualquer decisão que você precisou tomar no caminho.

## Stack de referência rápida

- Next.js 15, App Router, TypeScript, Tailwind CSS
- Banco: Postgres (Supabase ou Neon)
- Deploy: Vercel (auto-deploy a partir do GitHub)
- Sincronização de dados: cron job lendo XML da Kenlo, com filtro premium configurável (ver seção 5 de `docs/inglaterra-premium-spec-tecnica.md`)
- Rotas dinâmicas sem página de listagem/hub: `/lancamentos/[slug]` e `/condominios/[slug]` — a navegação entre eles acontece via dropdown no Header, não uma página `/lancamentos` ou `/condominios`
