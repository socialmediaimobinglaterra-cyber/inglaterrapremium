# Banners da Home

O site consulta banners ativos da tabela Postgres `home_banners`. A secao fica imediatamente abaixo dos imoveis em destaque e desaparece completamente quando nao ha banners. A consulta usa cache de 60 segundos, invalidado ao salvar ou remover pelo admin.

## Cadastro no admin

Em `/admin`, acessar **Banners da Home** (`/admin/banners`). Disponivel para admin e editor, com verificacao de sessao em todas as alteracoes. A tabela e criada automaticamente no primeiro acesso autenticado, reutilizando o padrao dos formularios do projeto.

Campos: imagem, descricao acessivel, link opcional HTTPS ou caminho interno, ordem numerica e ativo. Editar permite substituir a imagem ou preservar a atual, ativar/desativar e alterar a ordem. A remocao pede confirmacao. Novos banners ficam inativos por padrao.

Requer `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN` no ambiente Vercel. Upload privado no Vercel Blob, servido pela rota existente `/api/blob-image`. Imagens JPG/PNG/WebP de ate 8 MB sao decodificadas e otimizadas para WebP de ate 2400px; SVG nao e aceito. Arquivos antigos sao mantidos no Blob para evitar quebrar paginas em cache. Nao ha mais dependencia do Studio para banners; os demais conteudos continuam no Sanity. Nao foram migrados documentos homeBanner eventualmente criados no Sanity.

## Exibicao

- Um banner: imagem estatica, sem controles desnecessarios.
- Dois ou mais: troca a cada 6 segundos, anterior/proximo e pausa.
- Pausa durante foco de teclado, hover e aba do navegador oculta. Reducao de movimento desativa reproducao automatica inicialmente.
- Todas as imagens aparecem inteiras, sem corte; o primeiro banner define a proporcao estavel do carrossel. Usar a mesma proporcao nas artes evita faixas vazias.
- Sem cadastro: nenhum titulo, placeholder ou espaco reservado.
- Bairros: a secao editorial tambem desaparece quando nao ha cards disponiveis, sem alterar o mapa ou as regras de elegibilidade.
