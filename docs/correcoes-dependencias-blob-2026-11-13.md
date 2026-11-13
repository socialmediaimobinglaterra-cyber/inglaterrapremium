> Registro histórico. Para o pacote final autorizado, consulte [publicacao-seguranca-2026-11-13.md](publicacao-seguranca-2026-11-13.md). As propostas CRM/Sanity descritas abaixo foram excluídas antes da publicação.

# Correções locais de dependências e Blob — 2026-11-13

Base: commit `3c0c08cd358f5b1920464b7bf570778b697bbe03`, no mesmo worktree reconciliado. Sem commit, merge, push, deploy, migração, consulta a banco real, alteração de registros ou credenciais externas. O checkout antigo e seu backup permanecem preservados.

## Escopo vigente

Foram concluídas correções de dependências e política do proxy Blob. Conforme a orientação posterior do usuário, foram interrompidas investigação e alterações de Adalink/CRM/Studio/Sanity. Os ajustes de marca d’água ensaiados nesta etapa foram restaurados exatamente ao estado do início da tarefa. `lib/watermark-access.ts`, `lib/sanity.ts`, `lib/crm-catalog.ts` e `tests/sanity-security.test.ts` foram comparados byte a byte ao backup inicial e permanecem iguais.

Não criar dataset Sanity e não realizar testes/deploy em Preview são decisões vigentes. A exigência de dataset novo do relatório anterior não faz parte deste plano. As proteções locais anteriores de Preview foram preservadas, mas não serão usadas para testes nesta etapa.

## Preservação

Backup adicional local: `.audit-backups/pre-dependency-fixes/changes.zip`, com manifest de hashes, preservando os arquivos alterados/não rastreados presentes no início desta etapa. Integridade do ZIP verificada. Nenhum arquivo de ambiente ou credencial foi copiado para o build. Backups e cópias de build foram excluídos do Git e do escopo TypeScript.

## Dependências

Auditoria anterior: 18 pacotes vulneráveis (1 crítico, 10 altos, 7 moderados).
Auditoria atual: **zero vulnerabilidades reportadas**, incluindo desenvolvimento. Evidência: `dependency-audit-current.json`. Trata-se do resultado do banco de advisories npm consultado nesta data, não de garantia de inexistência de qualquer falha.

Atualizações selecionadas a partir dos advisories; não foi usado `npm audit fix`, `--force` ou atualização indiscriminada.

| Dependência resolvida | Antes | Depois | Motivo |
| --- | --- | --- | --- |
| Next e pacotes associados | 15.5.23 | 15.5.29 | Correções de segurança mantendo Next 15 |
| eslint-config-next | 15.5.23 | 15.5.29 | Alinhamento com Next |
| sharp | 0.35.4; cópia 0.34.5 sob Next | 0.35.5, compartilhado | Correções das bibliotecas nativas; remove cópia antiga |
| PostCSS sob Next | 8.4.31 | 8.5.33 | Override apenas sob Next, mesma versão principal |
| undici | 6.28.0 / 7.30.0 | 6.29.1 / 7.30.2 | Patches em cada linha, sem unificar versões principais |
| Zod sob cli-config | 4.1.11 | 4.6.6 | Override restrito, mesma versão principal |
| minimatch sob typescript-estree | 10.2.6 | 11.0.1 | Override de desenvolvimento: advisory também afeta a linha 10; API de glob usada pelo consumidor verificada |
| brace-expansion | 1.1.18 / 5.0.9 | 1.1.22 / 5.0.13 | Patches nas respectivas linhas |
| js-yaml | 4.3.1 | 4.3.2 | Patch de segurança |
| postcss-selector-parser | 6.1.4 | 6.1.6 | Patch de segurança |
| source-map-js | 1.2.1 | 1.2.2 | Patch de segurança |
| @vercel/oidc | 3.8.4 | 3.8.10 | Atualização compatível da cadeia vulnerável |
| @vercel/cli-config | 0.2.3 | 0.3.1 | Versão selecionada pela cadeia OIDC atualizada, com Zod corrigido |

Os alertas de @vercel/blob e dos pacotes typescript-eslint eram propagados por dependências transitivas. Foram eliminados corrigindo essas dependências; não foi necessário atualizar Blob ou toda a família typescript-eslint. A mudança principal em minimatch limita-se ao parser de desenvolvimento; as funções usadas foram exercitadas com testes e o build passou. Reavaliar a remoção dos overrides quando os upstreams incorporarem as versões corrigidas.

Referências primárias consultadas: [comunicado oficial Next de outubro](https://nextjs.org/blog/nextjs-security-update-october-14-2026), [release minimatch 11.0.1](https://github.com/isaacs/minimatch/releases/tag/v11.0.1), metadados do registro npm e URLs dos advisories no JSON. A versão 15.5.29 foi confirmada no registro npm; o comunicado explica os patches upstream de segurança, incluindo sharp.

## Política do proxy Blob

A URL do armazenamento não é mais suficiente para autorização.

- O contrato `/api/blob-image?url=...` foi mantido.
- Visitante público: somente URL exata persistida em `home_banners` com `ativo = true`. Consulta parametrizada, sem autorização por simples prefixo de pasta.
- Admin/editor autenticado: mantém acesso aos arquivos e banners inativos do armazenamento autorizado pelo token. A sessão é verificada pelo helper administrativo existente.
- Anônimo sem publicação correspondente recebe 404 antes de qualquer chamada ao Blob; erro de banco bloqueia o acesso.
- URL precisa usar HTTPS e hostname de armazenamento Blob válido, sem credenciais, porta não padrão, query ou fragmento.
- Respostas usam `private, no-store`, cabeçalhos para não armazenar em CDN, `Vary: Cookie`, `nosniff` e CSP restritiva.
- JPEG, PNG, WebP, AVIF e GIF continuam inline. Outros conteúdos, inclusive PDF, HTML e SVG, são entregues como download para administradores autorizados; arquivos não são apagados ou convertidos.
- Erros externos não são expostos nem registrados integralmente.
- Componentes de banners atuais foram inspecionados: Home usa Next Image; administração usa img direto e conserva cookies de sessão. Nenhum layout/componente visual foi alterado.

Só foi identificado um consumidor do proxy neste código atual: banners PostgreSQL. Catálogo e editoriais do site consultam imagens por seus mecanismos existentes e não foram alterados nesta tarefa.

Limites: um arquivo já entregue publicamente pode ter sido salvo. A política antiga permitia cache de um ano; a nova resposta não apaga cópias já armazenadas por visitantes/CDNs. Next Image também pode manter derivados de imagens que eram públicas. É necessária avaliação de invalidação dos caches existentes antes da publicação; nenhum cache remoto foi alterado. Arquivos externos não registrados como banners e usados por consumidores fora deste repositório não têm publicação comprovada e serão bloqueados para anônimos. Confirmar esse inventário antes de publicar; não ampliar automaticamente a permissão.

## Testes e build

- `npm run test:offline`: **119 aprovados, zero falhas** (`security-test-results.txt`).
- `npm run typecheck`: aprovado.
- `npm run build:offline`: **aprovado**, compilação Next 15.5.29, validação de tipos e geração de 16 páginas estáticas (`offline-build-results.txt`).
- `git diff --check`: aprovado.
- Auditoria npm: zero vulnerabilidades (`dependency-audit-current.json`).

Os novos testes cobrem autorização/revogação por publicação Blob, imagens e arquivos administrativos, entradas maliciosas, falha do banco, ausência de chamadas indevidas ao armazenamento, conversão real de imagens sintéticas AVIF/WebP pelo sharp, PostCSS do Next, parser TypeScript/minimatch e Zod.

O build é realizado em cópia local `.audit-build/<timestamp>`, com dependências do lockfile e fontes da aplicação preservadas. O script não copia `.env` e inicia o processo com ambiente mínimo sem credenciais, IDs Sanity sintéticos e telemetria desabilitada. O hook oficial de mock de next/font substitui apenas a resposta/font bytes para evitar download do Google. Rede HTTP/HTTPS, fetch e sockets reais ficam bloqueados pelo preloader de testes. A cópia ajusta apenas o diretório de tracing do Next para não alcançar o checkout pai. Os módulos de aplicação Sanity, SQL e blog NÃO são substituídos na versão final deste build. Rotas dinâmicas não são um teste de integração com dados reais. Esse artefato de build NÃO deve ser publicado, pois contém fonte/identificadores de teste.

## Integrações: trabalho interrompido por orientação do usuário

Antes da interrupção, a conexão GitHub foi consultada apenas para listar repositórios acessíveis; ela expõe Site Premium e Central de Atendimento. A cópia local `CRM Site` contém documentação de importação PostgreSQL de setembro/2026, sem evidência suficiente de representar o Adalink atual. O código local do Site Matriz afirma leitura do mesmo Sanity alimentado pelo CRM, mas isso não comprova o fluxo operacional. Não foram executadas sincronizações nem acessados registros Sanity. Não será realizada investigação adicional ou solicitada alteração desses sistemas nesta tarefa.

A rota de marca d’água permanece **exatamente como na base reconciliada no início desta tarefa**. Essa base já continha a proposta de exigir Bearer/WATERMARK_API_SECRET. Ela ainda não foi publicada, e a compatibilidade do consumidor não está verificada. Portanto a publicação integral do worktree continua bloqueada por esse item; não considerar a aprovação das dependências como autorização para publicar a mudança de contrato de marca d’água. Não foi mantido bypass/flag de compatibilidade novo nesta etapa.

## Antes de publicar — depende de decisão/autorização

1. Revisar e autorizar explicitamente o conjunto de alterações a publicar. Não publicar todo o worktree enquanto a proposta anterior de marca d’água continuar sem compatibilidade verificada; qualquer separação dessa mudança exige decisão própria.
2. Confirmar que o proxy não tem consumidores públicos externos para arquivos fora de banners ativos e planejar invalidação de caches antigos. Nenhum recurso externo foi alterado.
3. Executar build normal no processo de publicação autorizado (não reutilizar `.audit-build`) e confirmar runtime de produção compatível. Esta etapa validou Node 24.15.0 local, não acessou configuração da Vercel.
4. Manter o acompanhamento dos advisories e overrides pontuais; zero npm audit não substitui testes operacionais.
5. Continuam fora desta etapa as demais pendências anteriores, como proteção antispam/limites de OTP/BTS e confirmação dos privilégios reais do banco.

## Arquivos desta etapa

Código/configuração: `package.json`, `package-lock.json`, `.gitignore`, `tsconfig.json`, `app/api/blob-image/route.ts`, `lib/blob-policy.ts`, `scripts/build-offline.cjs`.
Testes: `tests/audit-boundaries.test.ts` (novos imports do proxy simulados), `tests/blob-policy.test.ts`, `tests/dependency-regression.test.cjs`.
Evidências: `dependency-audit-current.json`, `dependency-test-results.txt`, `security-test-results.txt`, `offline-build-results.txt` e este documento.
Os demais arquivos alterados no worktree são anteriores a esta tarefa e foram preservados.
