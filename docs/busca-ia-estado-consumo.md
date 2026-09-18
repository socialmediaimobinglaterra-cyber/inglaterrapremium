# Busca por IA: estado, consumo e limites

Fluxo: cliente -> gpt-4o-mini interpreta alteracoes -> servidor valida e aplica ao estado -> Postgres busca -> site renderiza. Nao sao enviados registros, descricoes, fotos ou historico de conversa.

## Estado

O cliente mantem um unico objeto de filtros. Ordenacao, carregar mais e controles manuais reutilizam esse objeto. Cada controle altera somente seu campo. A IA retorna operacoes `definir`/`remover` e `reiniciar` apenas para uma nova busca explicita. Campos omitidos permanecem. Inclui bairro, condominio, tipo, negocio, valores minimo/maximo, quartos, suites, vagas e areas minima/maxima (area_util com fallback area_total).

Os nomes distintos de bairros, tipos e condominios dos imoveis ativos sao consultados no banco e cacheados por 10 minutos. No prompt seguem no maximo 12 sugestoes por categoria relacionadas ao texto, nao o catalogo. A resposta e validada contra a lista completa com normalizacao de acentos/caixa e prefixos inequívocos; desconhecidos sao informados como nao interpretados e nao substituem filtros validos. Sugestoes nao restringem o schema.

## Protecao

- Query: 500 caracteres; corpo HTTP: 8 KiB; saida: 900 tokens; timeout: 8 segundos.
- IP: 12 tentativas/minuto e 100/dia. Global: 500/hora e 3000/dia, janelas fixas UTC.
- Contadores atomicos e compartilhados no Postgres, em transacao, funcionam entre instancias serverless. Bloqueios retornam HTTP 429 e Retry-After; filtros manuais continuam disponiveis.
- Identidade: HMAC diario do IP fornecido por x-vercel-forwarded-for na Vercel, sem armazenar IP puro. Fora da Vercel usa grupo local compartilhado. Ausencia do header usa grupo unknown. Falha no banco impede chamadas pagas (fail closed).
- Quotas globais limitam abuso distribuido; usuarios em uma mesma rede compartilham a quota IP. Ajustar limites em lib/ai-search-support.ts conforme trafego real.

## Banco e consumo

`db/ai-search.sql` contem apenas DDL aditivo. A primeira requisicao inicializa essas tabelas automaticamente, seguindo o padrao editorial existente, sem executar seeds nem modificar configuracoes premium. Nao usar o migrate geral para esta tarefa: seu seed atual regrava bairros permitidos.

`openai_usage_log` registra cada tentativa enviada a OpenAI: modelo retornado (ou solicitado quando nao houver resposta), created_at, prompt_tokens, completion_tokens, total_tokens, sucesso e codigo de erro. Tokens ausentes em timeout/erro ficam NULL, nunca zero inventado. Nenhuma query, resposta textual ou identificador de cliente e gravado. Se a gravacao falhar, metadados sem texto vao ao log da funcao. Requisicoes barradas antes da OpenAI nao sao consumo e nao entram nessa tabela.

```sql
select created_at, modelo, prompt_tokens, completion_tokens, total_tokens, sucesso, erro
from openai_usage_log order by created_at desc limit 100;

select date_trunc('day', created_at) as dia, modelo,
  count(*) as chamadas, count(*) filter (where not sucesso) as erros,
  count(*) filter (where total_tokens is null) as uso_desconhecido,
  sum(prompt_tokens) as entrada, sum(completion_tokens) as saida, sum(total_tokens) as total
from openai_usage_log group by 1, 2 order by 1 desc;
```

Testes sem chamadas pagas: `npx tsx --test tests/*.test.ts`. Testes de endpoint usam transporte OpenAI simulado; validacao em producao e consumo faturado exigem credenciais/ambiente real.
