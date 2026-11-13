> Registro histórico. Para o pacote final autorizado, consulte [publicacao-seguranca-2026-11-13.md](publicacao-seguranca-2026-11-13.md). As propostas CRM/Sanity descritas abaixo foram excluídas antes da publicação.

# Reconciliação da auditoria — arquitetura Sanity

Data: 2026-11-13. Base de referência e main remota confirmada por leitura GitHub: `3c0c08cd358f5b1920464b7bf570778b697bbe03`.
Checkout original: `08a317a530f38646379c4e13e08d2f8076b4a891`. A comparação entre commits contém 160 arquivos alterados. Nenhum merge, commit, push ou deploy foi feito.

## Preservação e base de trabalho

O checkout original continua intacto em `C:/Users/imobi/Documents/ChatGPT/Site Premium`.
Backup: `.audit-backups/20261113-192316/local-changes.zip`, com 60 caminhos modificados/não rastreados identificados pelo Git; conteúdo verificado por SHA-256 no `manifest.json`. Há também patches staged/unstaged, status e SHA inicial. Arquivos ignorados de ambiente e node_modules não foram lidos/copiados; continuam no checkout original.

Base reconciliada, separada e ainda sem commit: `C:/Users/imobi/.codex/worktrees/sanity-security-audit/Site Premium`.
O worktree está no commit publicado (HEAD destacado); as alterações propostas permanecem locais para revisão. Não substituí a pasta antiga nem misturei suas alterações de layout/catálogo com a versão publicada.

## Arquitetura anterior versus atual

| Área | Checkout antigo | Commit publicado / base atual |
| --- | --- | --- |
| Catálogo, busca, detalhes, mapa, bairros, condomínios, lançamentos, sitemap | PostgreSQL alimentado por XML | Consultas GROQ ao Sanity |
| Elegibilidade Premium | Importação/filtro SQL | `publicarPremium` explícito tem precedência; fallback configurável `premiumConfig` |
| Importação XML | Kenlo, endpoint e script próprios, cron | Endpoint, script, biblioteca e cron removidos; não recriados |
| PostgreSQL | Catálogo e serviços auxiliares | Administração/OTP, banners, analytics, quota/uso IA, consentimento/quota/idempotência de newsletter, contato e salva-busca |
| Escritas Sanity | Ausentes | Upload de imagens e patch de imóvel na rota de marca d’água; script manual `premium-config.cjs --apply` |
| Integrações de leads | BTS/Resend | Resend, RD Station e Central de Atendimento |

A dependência `fast-xml-parser` ainda estava no lockfile publicado, sem uso nos arquivos executáveis pesquisados. Foi removida localmente (8 pacotes removidos). Referências históricas a Kenlo/Gaia, documentos XML e mapeamentos legados não representam sincronização ativa e não foram apagados indiscriminadamente.

## Correções reaproveitadas e adaptadas

- Segredo administrativo obrigatório, sem fallback para segredo de sincronização ou valor público; tokens com segmentos extras recusados. Mesma assinatura HMAC e formato de sessão válidos preservados.
- OTP: bloqueio antes de lookup/escrita/envio em Preview e consumo condicional para impedir duas verificações simultâneas do mesmo código.
- Política central de ambiente, falha segura em ambiente desconhecido e bloqueio de efeitos reais fora de Production.
- TLS PostgreSQL com CA/hostname verificados, sem `rejectUnauthorized:false`; URL não é repassada ao parser do driver que poderia sobrescrever TLS.
- Preview PostgreSQL exige host exato, role declarada e denylist independente dos endpoints de Production, normalizando variantes direto/pooled para o bloqueio. Define sessão somente leitura e timeouts.
- Guardas de migração exigem confirmação explícita do ambiente e destino antes de obter pool. Nenhum script foi executado contra banco.
- Bloqueio de IA, BTS/Resend, Blob privado, analytics, convite de administradores e cliente CRM em Preview. Aplicado também aos formulários novos: newsletter, contato do imóvel, salva-busca, RD e Central.
- A ação atual de banners bloqueia antes de auth, SQL, upload e limpeza de Blob. DDL automático de banners não roda em Preview; stores e quota IA recusam escrita antes de obter pool.
- Leitor Sanity expõe apenas `fetch`, sem token de escrita. Preview exige projeto/dataset explícitos, confirmação independente e lista de destinos de Production bloqueados. Ambiente ausente e fallback para dataset publicado são recusados antes da consulta.
- Rota de marca d’água exige Production, projeto/dataset explícitos, token de escrita e Bearer com segredo dedicado. Mantém o contrato GET existente apenas para clientes autenticados. Erros externos deixam de ser devolvidos ao cliente.
- Escrita manual do `premium-config.cjs` exige confirmação explícita do destino antes de ler credenciais ou consultar o serviço.

Não foram reaplicados: importador Kenlo, testes de batches XML, endpoint de sincronização, cron, guardas em páginas administrativas já removidas, SQL antigo do catálogo, nem alterações locais antigas de layout/busca. Tudo permanece recuperável no checkout/backup original.

## Sanity: leituras, escritas e CRM

`lib/sanity.ts` atende as consultas do catálogo e navegação. O cliente publicado usa `useCdn:false` e não anexa token; portanto a arquitetura atual depende de leitura pública do dataset. A consulta tem filtros de publicação, mas isso não é uma barreira de acesso ao dataset: apenas conteúdo destinado ao público deve estar nele. Um Preview público deve conter exclusivamente fixtures fictícias. Suporte a dataset privado com token somente leitura requer revisão própria e não foi improvisado.

`app/api/watermark-test/route.ts` lê configurações/imagens, busca os assets, aplica marca d’água via sharp, faz `sanity.assets.upload` e `sanity.patch(...).set(...).commit()`. O comentário de contrato identifica chamadas do Sanity Studio e Adalink-CRM na aprovação da captação. `scripts/premium-config.cjs --apply` envia mutação para `premiumConfig`. Os scripts `cep-bairros.cjs` e `validar-regra-premium.ts` consultam dados remotamente; não foram executados.

O repositório declara que o CRM é dono de `neighborhood` e que `publicarPremium`, quando definido, decide a publicação. Isso é evidência de contrato externo, não confirmação de execução de uma sincronização. A conexão GitHub atual expõe somente Site Premium e Central de Atendimento; a árvore desta última contém integrações de leads e feed, sem módulo Sanity identificado pelo nome. O código do Adalink/Studio não está disponível nesta conexão. Falta acesso de leitura ao repositório correspondente para confirmar origem, gatilhos, frequência, permissão do token e eventual XML upstream. Não foi feita chamada aos endpoints CRM, Sanity ou sincronizadores.

## Variáveis necessárias (nomes apenas)

| Finalidade | Variáveis | Observação |
| --- | --- | --- |
| Leitura Sanity Production | `SANITY_PROJECT_ID`, `SANITY_DATASET` | Identificadores não secretos; fallback publicado preservado somente para leitura em Production |
| Leitura isolada Preview | anteriores + `PREVIEW_SANITY_PROJECT_ID`, `PREVIEW_SANITY_DATASET`, `PRODUCTION_SANITY_TARGETS` | Lista `projeto/dataset` separada por vírgula; projeto/dataset de Preview devem corresponder e não constar na lista; destino publicado conhecido também é negado |
| PostgreSQL | `DATABASE_URL` | Ainda necessário para funções auxiliares, não para o catálogo |
| PostgreSQL Preview | `PREVIEW_DATABASE_HOST`, `PREVIEW_DATABASE_ROLE`, `PRODUCTION_DATABASE_HOSTS` | Conexão da branch homologacao, role realmente somente leitura e endpoints de Production direto/pooled |
| Administração | `ADMIN_SESSION_SECRET`, `RESEND_API_KEY`; opcionais `ADMIN_EMAIL_FROM` | Sem segredo válido, sessões não são aceitas; OTP desabilitado em Preview |
| BTS | `RESEND_API_KEY`; opcionais `BTS_CONTACT_TO`, `ADMIN_EMAIL_FROM` | Bloqueado em Preview |
| Busca IA | `OPENAI_API_KEY` + PostgreSQL | Bloqueada em Preview |
| Banners/Blob | `BLOB_READ_WRITE_TOKEN` + PostgreSQL | Upload e proxy privado bloqueados em Preview |
| Newsletter/contato | `RD_STATION_API_KEY` + PostgreSQL | Bloqueados em Preview |
| Salva-busca | `RD_STATION_API_KEY`, `CENTRAL_INTEGRATION_TOKEN` + PostgreSQL | Bloqueado em Preview |
| Marca d’água | `SANITY_WRITE_TOKEN`, novo `WATERMARK_API_SECRET`, projeto/dataset explícitos | Apenas servidor Production; CRM/Studio precisam enviar `Authorization: Bearer ...` por backend, nunca embutir segredo no browser |
| Scripts manuais Sanity | `SANITY_API_TOKEN`, `SANITY_WRITE_TOKEN` conforme script | Não necessários ao leitor público do site; nunca executar automaticamente no Preview |

Kenlo/CRON não são necessários ao site atual. Não se deve copiar segredos de Production para Preview. Nenhuma existência/valor de variável no painel foi consultada ou alterada nesta etapa.

## PostgreSQL e homologação Neon

Neon homologacao continua pertinente para conferir schema e leitura de banners/admin, sem misturar a persistência auxiliar com Production. A role somente leitura serve para inspeções e renderização dependente de SELECT; não permite testar login por OTP, convites, envio de formulários, quotas IA ou edição de banners com escrita real. Nesta proposta esses fluxos ficam bloqueados no Preview e são testados com mocks localmente.

Igualdade de hostname, denylist e nome de role são proteções de configuração, não comprovação criptográfica da branch. Ainda é necessário validar no Neon a branch, seus endpoints e privilégios efetivos. A role do banco deve impedir escrita de verdade; `default_transaction_read_only` sozinho não substitui privilégios. Nada disso foi consultado nesta etapa.

## Validação local

- `npm ci --ignore-scripts --no-audit --no-fund`: lockfile publicado instalado em worktree separado.
- `npm run test:offline`: 110 testes aprovados, zero falhas. Harness bloqueia fetch, HTTP/HTTPS e sockets reais; testes usam dados sintéticos e mocks de Sanity, PostgreSQL, Blob, OpenAI, Resend e RD/Central.
- `npm run typecheck`: aprovado (`tsc --noEmit --incremental false`).
- `VERCEL_ENV=production node --require ./tests/offline.cjs --import tsx scripts/test-crm-catalog.ts`: aprovado, sem `--live`, transporte injetado.
- `git diff --check`: aprovado.
- Corrigidos mocks desatualizados no commit de referência: tipo de imóvel nas opções e leituras de `premiumConfig`/bairros nos testes de cache; preservadas verificações de cache/expiração/falhas.
- Regressões cobrem catálogo/mapa, regras Premium, preço, busca, sessão/OTP, TLS, formulários, banners e autorização da marca d’água. Teste de marca d’água usa imóvel sintético sem imagens; transformação visual completa e caller externo não foram validados.
- Não foi executado build Next, servidor conectado a dados reais, Lighthouse ou testes browser: podem consultar fontes remotas. Falta smoke test completo com dataset fictício e integrações simuladas antes de publicar.
- `npm audit --json` no lockfile reconciliado: 18 pacotes vulneráveis (1 crítico, 10 altos, 7 moderados). Next aparece como crítico. Relatório em `dependency-audit.json`. Não foi executado `audit fix` nem upgrade amplo sem regressão específica.

## Impedimentos antes de publicar

1. Atualizar as dependências vulneráveis, especialmente Next, e repetir regressão/build isolado.
2. Confirmar presença de `ADMIN_SESSION_SECRET` válido em Production; ausência causa bloqueio intencional, não fallback inseguro.
3. Coordenar autenticação da marca d’água com o backend do CRM/Studio e configurar o novo segredo fora do browser. Clientes atuais sem header serão recusados: NÃO publicar esta mudança antes de adaptar e testar esses consumidores.
4. Configurar dataset/projeto Sanity exclusivo de Preview, com dados sintéticos, e suas variáveis de confirmação/denylist. Sem isso consultas do catálogo ficam bloqueadas; a branch Neon não resolve esse isolamento.
5. Verificar branch/role/schema Neon e denylist fora desta etapa. Confirmar TLS real com ambiente isolado autorizado; testes locais comprovam opções e rejeição de hostname errado, não conectividade de Production.
6. Resolver política do proxy Blob: em Production ele ainda aceita URL de Blob sem autenticar visitante nem vincular o asset a um registro publicado. Validar se o store contém apenas imagens públicas ou restringir por assets publicados antes de considerar a auditoria encerrada.
7. Revisar permissões do token Sanity de escrita e o caminho CRM → Sanity com acesso ao repositório certo. Não confundir comentário/contrato com confirmação operacional.
8. Revisar migração antiga `db/schema.sql` antes de qualquer uso: não executar como preparação automática do novo catálogo. DDL em requisições Production permanece como no código publicado.
9. Validar rate limiting/antispam do BTS e OTP e executar smoke visual em Preview isolado. Bloqueios de Preview não corrigem abuso desses endpoints em Production por si só.

O site em produção não foi modificado. Esta proposta está preparada para revisão, mas ainda não está liberada para publicação.

## Destino dos 49 testes anteriores

Os 49 itens eram testes automatizados, não 49 correções independentes. Resultado por cenário: Mantido: 32, Adaptado: 7, Retirado: 10. A suíte atual tem 110 testes porque inclui as regressões do commit Sanity e novas fronteiras de segurança.

| Arquivo anterior | Cenário anterior | Decisão | Cobertura atual / motivo |
| --- | --- | --- | --- |
| `ai-route.test.ts` | one OpenAI call, only structured state, real usage propagated | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `ai-route.test.ts` | rate limited requests never reach OpenAI | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `ai-route.test.ts` | oversized or invalid queries never reach OpenAI | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `ai-route.test.ts` | HTTP errors and timeouts record failure without query | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `ai-route.test.ts` | unauthorized CRM preview never reaches OpenAI or usage logging | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `ai-route.test.ts` | authorized local preview returns filters without production usage logging | Adaptado | Preview local/remoto bloqueia IA; diagnóstico autenticado em Production mantém quota e registro com mocks. |
| `ai-route.test.ts` | authorized remote preview records usage and honors quota | Adaptado | Preview local/remoto bloqueia IA; diagnóstico autenticado em Production mantém quota e registro com mocks. |
| `ai-route.test.ts` | Preview AI cannot spend credits even when a key exists | Adaptado | Preview local/remoto bloqueia IA; diagnóstico autenticado em Production mantém quota e registro com mocks. |
| `audit-boundaries.test.ts` | sync denies Preview, unknown env and bad Bearer; valid production supports either secret | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `audit-boundaries.test.ts` | configured production sessions round-trip; tampered and extra-segment tokens fail | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `audit-boundaries.test.ts` | Preview refuses OTP before looking up users, writing codes or sending email | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `audit-boundaries.test.ts` | BTS is blocked in Preview even with a key; valid production sends through mocked Resend | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `audit-boundaries.test.ts` | Blob upload boundary blocks Preview before SDK call and preserves production | Adaptado | Proteção aplicada à ação de banners atual; testes verificam upload, falha e limpeza por SDK simulado. |
| `audit-boundaries.test.ts` | Preview page helpers issue neither DDL nor analytics writes | Adaptado | DDL de bairros/Instagram removido; proteção e teste cobrem banners, analytics e stores atuais. |
| `audit-boundaries.test.ts` | private Blob proxy refuses Preview before attempting SDK access | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `audit-boundaries.test.ts` | session rejects a token signed with the removed fallback secret | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `audit-boundaries.test.ts` | sync refuses missing secret before touching the database | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `audit-boundaries.test.ts` | concurrent OTP verifications only accept one conditional consumption | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `audit-boundaries.test.ts` | BTS rejects missing fields and missing provider key without sending email | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `kenlo-sync.test.ts` | 2221 properties use 23 bounded parameterized batches and preserve manual fields | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `kenlo-sync.test.ts` | premium location and price rules remain unchanged | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `kenlo-sync.test.ts` | duplicate source codes keep the last occurrence without a batch conflict | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `kenlo-sync.test.ts` | Bairro drives display, relationships and eligibility regardless of BairroOficial | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `kenlo-sync.test.ts` | empty Bairro does not silently use BairroOficial for premium eligibility | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `kenlo-sync.test.ts` | failed batch rolls back the catalog and records the failed stage | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `kenlo-sync.test.ts` | empty XML cannot deactivate the catalog | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `kenlo-sync.test.ts` | overlapping sync is rejected before catalog writes | Retirado | Implementação Kenlo removida no commit publicado; preservado apenas no backup. |
| `postgres-config.test.ts` | production Neon direct/pooled URLs keep identity and use verified TLS in actual pg configuration | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `postgres-config.test.ts` | default TLS hostname verifier rejects wrong certificate identity without network | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `postgres-config.test.ts` | unsafe TLS, filesystem certificates and destination overrides fail without leaking URL | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `postgres-config.test.ts` | preview needs independent production denylist and dedicated role, and remains read-only | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `postgres-config.test.ts` | production denylist wins even if both preview URL and approved hostname are misconfigured | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `postgres-config.test.ts` | production does not require new Preview variables and preserves explicit options | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `property-map.test.ts` | zoom changes grouping; every pin resolves to its exact members | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `property-map.test.ts` | coincident coordinates stay grouped; stale or invalid links never broaden the search | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `property-map.test.ts` | SQL limits pins to visible geolocated properties and preserves exact selection for count, sort and pagination | Adaptado | Consulta SQL substituída por GROQ; teste atual verifica seleção, contagem, ordenação e paginação no Sanity. |
| `runtime-policy.test.ts` | environment defaults deny effects; NODE_ENV production alone is insufficient | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `runtime-policy.test.ts` | admin secret never falls back to sync secret or a public default | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `runtime-policy.test.ts` | preview database requires exact approved host and forces read-only defaults | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `runtime-policy.test.ts` | write scripts require both environment and exact destination confirmation | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `runtime-policy.test.ts` | direct Kenlo and production CRM calls are denied in Preview before I/O | Adaptado | Mantido bloqueio do cliente CRM; chamada direta Kenlo eliminada. |
| `search-state.test.ts` | incremental suites preserve location, type and price | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `search-state.test.ts` | replace price and type; explicitly remove bairro | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `search-state.test.ts` | all dimensions survive an empty patch | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `search-state.test.ts` | unknown locations do not silently replace valid locations | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `search-state.test.ts` | canonical names and condominium prefix | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `search-state.test.ts` | reset clears state only when requested | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `search-state.test.ts` | ranges cannot be inverted | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |
| `search-state.test.ts` | untrusted state excludes histories, records and invalid numbers | Mantido | Mesmo cenário coberto na suíte atual, com dependências simuladas. |

## Arquivos modificados e criados nesta base

- `app/admin/banners/actions.ts`
- `app/api/blob-image/route.ts`
- `app/api/bts/contact/route.ts`
- `app/api/imoveis/ai/route.ts`
- `app/api/imoveis/contato/route.ts`
- `app/api/imoveis/salvar-busca/route.ts`
- `app/api/newsletter/route.ts`
- `app/api/watermark-test/route.ts`
- `dependency-audit.json`
- `docs/auditoria-sanity-reconciliada.md`
- `lib/admin/auth.ts`
- `lib/admin/banners.ts`
- `lib/admin/login-codes.ts`
- `lib/admin/session.ts`
- `lib/ai-search-support.ts`
- `lib/analytics.ts`
- `lib/crm-catalog.ts`
- `lib/crm-preview-access.ts`
- `lib/crm-preview.ts`
- `lib/db.ts`
- `lib/postgres-config.ts`
- `lib/premium-rule.ts`
- `lib/rd-contact-store.ts`
- `lib/runtime-policy.ts`
- `lib/sanity-policy.ts`
- `lib/sanity.ts`
- `lib/saved-search-delivery.ts`
- `lib/saved-search-store.ts`
- `lib/script-safety.ts`
- `lib/watermark-access.ts`
- `middleware.ts`
- `package-lock.json`
- `package.json`
- `scripts/migrate.ts`
- `scripts/premium-config.cjs`
- `scripts/sanity-script-safety.cjs`
- `test-results.txt`
- `tests/admin-banners.test.ts`
- `tests/ai-route.test.ts`
- `tests/ai-vocabulary.test.ts`
- `tests/audit-boundaries.test.ts`
- `tests/filter-options-cache.test.ts`
- `tests/newsletter.test.ts`
- `tests/offline.cjs`
- `tests/postgres-config.test.ts`
- `tests/property-inquiry.test.ts`
- `tests/public-performance.test.cjs`
- `tests/runtime-policy.test.ts`
- `tests/sanity-security.test.ts`
- `tests/saved-search.test.ts`
