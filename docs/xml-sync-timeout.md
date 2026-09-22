# Importacao XML: timeout do agendamento

## Evidencia e diagnostico

Em 22/09/2026, a execucao automatica de `/api/sync-kenlo` as 03h de
Brasilia retornou 504 apos 300 segundos. O agendamento funcionou; esse
erro nao foi de autenticacao.

Uma leitura local, sem gravacao, encontrou 2.221 registros no XML atual
(34.434.602 bytes). Download: 1.203 ms; parse: 1.048 ms. Esses tempos nao
medem a rede da Vercel nem comprovam a etapa exata do timeout anterior.

O codigo executava uma gravacao sequencial por imovel. Agora usa lotes de
100 registros: 23 comandos para os 2.221 imoveis medidos, em vez de 2.221.
Condominios tambem sao gravados em lotes. Correcoes de nomes existentes
usam atualizacoes em conjunto.

## Protecoes preservadas e diagnostico novo

- Mesma transacao para todo o catalogo e inativacao; falhas revertem os dados.
- Conflitos so atualizam imoveis de origem `kenlo`; inativacao tem a mesma restricao.
- `inclusao_manual` e `is_premium_override` nunca sao sobrescritos.
- Filtro premium, pisos de preco e configuracao de bairros nao foram alterados.
- Codigos repetidos no XML mantem os dados da ultima ocorrencia.
- XML sem registros validos e recusado, sem inativar o catalogo.
- Advisory lock transacional impede duas importacoes concorrentes de gravar.
- Download limitado a 60s; comandos SQL a 30s; espera por locks a 5s.
- Novos lotes sao interrompidos se o processamento ja ultrapassou 240s.
- Transacao ociosa e encerrada pelo Postgres apos 60s, inclusive se o processo morrer.
- Logs `[xml-sync]` mostram etapa, duracao e progresso, sem conteudo dos imoveis.
- `sincronizacoes_log.metadata` guarda tempos; erros incluem a etapa interrompida.

O agendamento continua diario, as 06h UTC / 03h de Brasilia. Nao foi
aumentado o limite da funcao nem usada a CLI da Vercel.

## Validacao

`npx tsx --test tests/kenlo-sync.test.ts` cobre lotes, parametros, regras
premium, protecoes de origem/curadoria no SQL, duplicidade de codigo,
rollback, XML vazio e concorrencia. Usa um cliente de banco simulado;
nao substitui o teste de integracao no Postgres real.

Neste ambiente nao ha `DATABASE_URL` configurada. Por isso nao foi possivel
consultar o ultimo sucesso, verificar o estado deixado pelo timeout ou
medir uma importacao real completa. O codigo anterior tambem usava uma
transacao para o catalogo, portanto nao deveria confirmar lotes parciais.
Uma interrupcao forcada pode deixar o log como `running`.

Apos publicar via GitHub, conferir os logs da execucao e consultar:

```sql
select started_at, finished_at, status, total_xml, total_premium,
       error_message, metadata
from sincronizacoes_log
order by started_at desc
limit 10;
```

Confirmar `status = 'success'`, total coerente com o XML e duracao abaixo
de 300s antes de considerar resolvido o timeout em producao.
