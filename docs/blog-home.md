# Noticias reais na Home

Fonte publica: `https://vmi.imobiliariainglaterra.com.br/api/public/posts?limit=3&offset=0`.
Sem autenticacao, escrita ou copia do corpo dos artigos. Campos consumidos: titulo, resumo, capa, categoria, data e link.

- Tres posts mais recentes retornados pela API, ordenados por data, sem repeticao de link e sem datas futuras.
- Cache no servidor de 15 minutos; a revalidacao ocorre sob demanda de visitas, nao por agendamento.
- Timeout de 3,5 segundos e carregamento em Suspense para nao bloquear a parte inicial da Home.
- Falha sem cache utilizavel ou lista vazia: secao inteira oculta. Nenhum conteudo ficticio substitui o blog.
- Categoria ausente: nao exibe categoria. Capa ausente, invalida ou quebrada: nao inventa foto.
- Links de artigos restritos ao dominio do blog. Otimizacao de imagens restrita ao bucket publico post-images do projeto Supabase atualmente usado pelo blog.
- "Ver todas as noticias" abre o blog; cada card abre o artigo original.

Se o blog mudar o dominio, o formato da API ou o armazenamento das capas, atualizar lib/blog-posts.ts e next.config.ts. O blog e apenas consultado, nao modificado.
