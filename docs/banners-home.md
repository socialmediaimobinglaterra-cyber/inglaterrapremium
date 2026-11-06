# Banners da Home

O site consulta documentos `homeBanner` publicados e ativos, no mesmo projeto/dataset Sanity ja configurado. A secao fica imediatamente abaixo dos imoveis em destaque e desaparece completamente quando nao ha banners validos. A consulta usa cache de 60 segundos.

## Cadastro no Studio

O codigo do Sanity Studio nao esta neste repositorio. Para disponibilizar o cadastro no Studio existente, registrar a definicao de `docs/sanity/homeBanner.js` no array `schemaTypes` daquele projeto e publicar o Studio pelo fluxo habitual. Se houver menu personalizado, incluir o tipo `homeBanner` nele tambem. Este arquivo nao registra o schema remotamente nem cria outro Studio.

Campos: nome interno, imagem, descricao acessivel, link opcional HTTPS ou caminho interno, ordem e ativo. Publicar o documento depois de ativar. Nao foram criados documentos ou imagens ficticias.

## Exibicao

- Um banner: imagem estatica, sem controles desnecessarios.
- Dois ou mais: troca a cada 6 segundos, anterior/proximo e pausa.
- Pausa durante foco de teclado, hover e aba do navegador oculta. Reducao de movimento desativa reproducao automatica inicialmente.
- Todas as imagens aparecem inteiras, sem corte; o primeiro banner define a proporcao estavel do carrossel. Usar a mesma proporcao nas artes evita faixas vazias.
- Sem cadastro: nenhum titulo, placeholder ou espaco reservado.
- Bairros: a secao editorial tambem desaparece quando nao ha cards disponiveis, sem alterar o mapa ou as regras de elegibilidade.
