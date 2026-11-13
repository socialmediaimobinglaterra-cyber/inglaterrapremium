# Pacote de segurança autorizado — 13/11/2026

Base: `3c0c08cd358f5b1920464b7bf570778b697bbe03`. Publicação autorizada pelo usuário via push em main, excluindo somente alterações desta auditoria relacionadas a CRM/Sanity.

## Incluído

- Next 15.5.29, sharp 0.35.5 e correções pontuais transitivas; auditoria npm sem vulnerabilidades reportadas na última execução.
- Sessões administrativas sem fallback inseguro, consumo condicional de OTP e verificações de ambiente nos efeitos externos do site.
- TLS PostgreSQL com validação de certificado e isolamento de conexões fora de Production; confirmação explícita para script de migração.
- Proxy Blob: banners ativos acessíveis publicamente por URL registrada; demais arquivos exigem sessão administrativa. Respostas sem cache público e conteúdos executáveis entregues como download.
- Testes offline, regressões de dependências e script de build local isolado.

## Excluído por determinação do usuário

Os seguintes arquivos foram restaurados byte a byte ao código de main anterior à auditoria: `lib/sanity.ts`, `lib/premium-rule.ts`, `lib/crm-catalog.ts`, `lib/crm-preview.ts`, `lib/crm-preview-access.ts`, `app/api/watermark-test/route.ts`, `scripts/premium-config.cjs` e `middleware.ts` (compartilhava alterações com o acesso CRM).

Não entram os novos helpers `lib/sanity-policy.ts`, `lib/watermark-access.ts`, `scripts/sanity-script-safety.cjs`, nem seus testes. A rota diagnóstica CRM `/preview/crm/api/ai` conserva o comportamento anterior quanto ao bloqueio de ambiente; o bloqueio novo permanece no endpoint público de IA.

Nenhuma regra de catálogo, consulta Sanity, sincronização, cron ou integração XML foi criada ou reintroduzida. As correções da validação de sessão administrativa são compartilhadas pelo site: tokens com ADMIN_SESSION_SECRET válido mantêm seu formato; fallback inseguro não é aceito.

## Validação

113 testes offline aprovados após a exclusão. TypeScript aprovado. Build Next local isolado, sem credenciais e com rede bloqueada; somente resposta de fonte Google e identificadores de ambiente são sintéticos. Esse artefato não deve ser publicado: a Vercel fará seu próprio build a partir do código Git.

## Preservação e limites

As propostas excluídas estão no backup local `.audit-backups/pre-publication/changes.zip`; os backups anteriores e checkout original foram mantidos. Logs de testes/build, relatórios npm brutos, backups, node_modules e builds locais ficam fora do commit.

A autenticação adicional da marca d’água NÃO faz parte desta publicação; o endpoint continua com o contrato original, inclusive seus riscos conhecidos. Nenhuma variável ou credencial externa será modificada. Sessões administrativas exigem ADMIN_SESSION_SECRET válido. Privilégios reais do banco e conectividade TLS de Production não foram inspecionados por testes locais. O proxy Blob não revoga cópias de arquivos anteriormente públicos já armazenadas por navegadores/otimizadores; consumidores anônimos externos de arquivos não publicados como banners não são autorizados.
