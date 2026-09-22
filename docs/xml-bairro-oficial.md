# Bairro usado na importacao XML

Decisao final corrigida em 22/09/2026: usar exclusivamente `Bairro` da fonte
XML, nao `BairroOficial`. Esta decisao substitui a prioridade anterior.
Quando `Bairro` estiver vazio, nao preencher com `BairroOficial`.

O adaptador aplica a escolha em `ParsedImovel.bairroNome`, antes do filtro
premium e da persistencia. Esse valor alimenta `imoveis.bairro_nome`, o
vinculo `bairro_id`, as contagens por bairro e o bairro dos condominios.
As consultas publicas e administrativas existentes continuam consumindo
esses mesmos campos. Os rotulos visuais continuam `Bairro` e `Bairros`.

O campo `bairro_oficial` e o XML original em `raw` permanecem preservados.
Nao se substitui texto dentro de titulos ou descricoes fornecidos pelo XML.
Nao se alteram os pisos de preco, a lista de bairros permitidos, os
condominios premium, a curadoria manual ou os registros de origem manual.
Imagens, descricoes e FAQ editoriais dos bairros nao sao modificados.

A alteracao dos dados existentes acontece na proxima sincronizacao completa,
com recalculo da elegibilidade automatica. A implementacao nao precisa de
migracao de schema nem de uma atualizacao SQL separada.

Teste: `npx tsx --test tests/kenlo-sync.test.ts`. Inclui entrada e saida do
filtro conforme `Bairro`, independencia de `BairroOficial`, piso de valor,
condominio premium, vinculos e contagens.
