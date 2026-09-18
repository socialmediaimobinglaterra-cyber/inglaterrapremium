# Preparacao da integracao com o CRM

## Previa protegida na Vercel - 2026-09-18

- Usuario autorizou preparar previa protegida e commit/push/deploy, sem substituir busca publica. /preview/crm e conversa/ficha exigem admin fora do ambiente local. Middleware verifica sessao; paginas, APIs e acesso ao catalogo revalidam usuario/papel no banco via autenticacao existente. Falta de segredo configurado, usuario removido/editor ou falha no banco negam acesso. POST autenticado exige Origin do proprio site.
- Fora do desenvolvimento local, o catalogo usa somente a API oficial HTTPS do CRM. Formulario tecnico /preview/crm/imoveis continua local. Home e busca publica mantem endpoints/defaults anteriores; previa fora do sitemap, sem cache/indexacao e sem analytics de busca.
- OpenAI usa chave ja configurada na Vercel e quota distribuida/registro de uso existentes do Premium. Nao ha segredo novo, leitura de valor de chave, migracao ou alteracao de ambiente. Local continua com limite sintetico proprio; nao ha fallback para banco legado de imoveis.
- Testes de acesso, conversa simulada, TypeScript e build aprovados. Smoke do build de producao local confirmou redirect de paginas anonimas para /admin/login, APIs anonimas 404 e no-store. Nenhuma chamada real OpenAI nesta etapa.
- Push/deploy e verificacao autenticada na Vercel ainda pendentes no momento deste registro. Primeiro publicar filtros CRM, depois previa Premium. Login usa conta admin do site Premium, nao sessao do CRM. Link previsto: https://inglaterrapremium.vercel.app/preview/crm .

## Conversa existente conectada ao CRM na previa - 2026-09-18

- Usuario esclareceu que a experiencia publica e conversacional e autorizou adaptar componentes compartilhados, sem commit/push/deploy. O formulario anterior em /preview/crm/imoveis permanece apenas ferramenta tecnica, nao proposta de substituicao da busca.
- Entrada http://localhost:3004/preview/crm reutiliza HomeHeroSearch e encaminha para /preview/crm/conversa, que reutiliza BuscaImoveisClient. Defaults continuam /imoveis e /api/imoveis/*; paginas publicas nao ativam o modo CRM.
- Handler de IA existente reutilizado pela rota local: mesmo modelo, prompt, schema e aplicacao cumulativa de criterios; somente vocabulario vem do GET CRM. Consulta posterior usa GET CRM, nunca banco legado. POSTs da previa sao endpoints do site, nao escrita na API do CRM.
- Previa exige development sem Vercel no middleware/paginas/rotas/cliente. Limite local de tres interpretacoes por hora e processo; nao substitui o rate limiting distribuido de producao. Previa nao grava analytics nem uso no banco legado. Producao conserva limites e registros anteriores.
- Resultados usam campos explicitos, precos/areas formatados como decimais sem Number, foto real pelo proxy oficial e link local apenas para CA5278. Sem slugs inventados nem fallback ao catalogo antigo. Falhas de consulta mantem resultados e mostram erro.
- Teste scripts/test-crm-conversation.ts aprovado com OpenAI/CRM simulados: handler compartilhado, criterios cumulativos/remocao, privacidade, precisao, falha de consulta, quota e bloqueio fora de development. Sem credenciais ou rede.
- Edge: entrada da home e tres respostas IA simuladas consultaram CRM real, retornando 1/0/1 conforme limites de area. Desktop/mobile sem overflow; foto carregada confirmada em nova captura apos captura transitoria vazia. TypeScript e build aprovados. Nenhum imovel real alterado.
- OPENAI_API_KEY ausente no ambiente local (verificada somente presenca, sem expor valores). Conversa real ainda nao validada; requer configuracao segura da chave. Nenhum consumo OpenAI realizado. Aceite visual desta previa conversacional pendente.

## Busca local - 2026-09-18

- Usuario aprovou ficha CA5278 e nome publico de condominio/edificio. Nova rota http://localhost:3004/preview/crm/imoveis com filtros GET de negociacao, cidade, bairro, tipo, condominio, precos, areas, ambientes e ordenacao; paginacao preserva filtros. /imoveis nao mudou, somente CA5278 tem link de detalhe nesta previa; nenhum slug inventado.
- API local fixa http://127.0.0.1:3005 permitida somente em development sem marcadores Vercel. CRM adicionou condominio e areaMaxima sem migracao. Ficha piloto e fotos continuam na API/proxy oficial. Sem alteracao de arquivos de ambiente ou credenciais no cliente.
- Nome usa trim, prioridade nomeCondominio e fallback nomeEdificio. Area util ou total, conversao ha para m2 e exclusao de area/unidade desconhecida quando filtrada. Nenhum endereco privado publicado.
- Testes do cliente/parser, TypeScript e builds CRM/Premium aprovados. Teste autorizado no Neon com fixtures exclusivas e limpeza confirmada; nenhum imovel real ou Blob alterado.
- Edge 1440px/390px sem overflow e foto carregada. Selecao de condominio com area maxima 497 retorna zero; 498 retorna CA5278. Ficha/retorno funcionam; intervalo invertido apresenta erro especifico. Paginacao adicional coberta por testes, pois o recorte real tem um imovel publicado.
- Servidores locais 3004 (Premium) e 3005 (CRM) necessarios. Sem commit/push/deploy. Aceite visual da busca pendente; nao representa paridade completa do site nem validacao dos filtros em producao.

Autorizada pelo usuario em 2026-09-18, sem publicacao em producao. O CRM oficial e https://admin.inglaterrapremium.com.br. Deploy do cache no commit b149a28 confirmado pelo usuario.

## Limites desta entrega

- Preparar cliente de leitura e testes; nao trocar a fonte das paginas existentes, nem remover importador, banco ou administracao legados.
- Preservar alteracoes locais ja existentes na busca/IA. Nao fazer commit/push ou deploy nesta preparacao.
- Dados do CRM tem cache interno de ate 60 segundos. O consumidor deve usar fetch no-store e nao somar ISR/cache de pagina. Fotos devem usar o proxy oficial diretamente, sem cache adicional de next/image que contorne a retirada de publicacao.
- Nao consultar o banco do site ou CRM nesta entrega. Nenhuma credencial e necessaria para GET publico.

## Pendencias antes da troca de fonte

| Tema | Evidencia no codigo | Criterio para avancar |
| --- | --- | --- |
| URLs | O site persiste slug e codigo da origem; o CRM entrega publicCode, sem slug ou identidade externa publica | Obter mapeamento confiavel das URLs atuais para o codigo atribuido no CRM; nao reconstruir slug pelo titulo atual nem presumir igualdade dos codigos |
| Busca | A busca atual aceita condominio e areaMaxima; a API inicial nao | Implementar suporte ou aprovar mudanca explicita; nunca ignorar filtro silenciosamente |
| Tipos | Site usa rotulos da origem, CRM usa chaves normalizadas | Mapear rotulos e parametros sem perder significado |
| Precos/areas | Site usa number; CRM strings decimais, areas m2/ha | Adaptar exibicao preservando precisao e unidade, sem conversao implicita |
| Ficha | Site tem endereco, coordenadas e corretor; CRM nao os entrega | Nao reintroduzir dados privados por consulta ao legado |
| Cobertura | Home, semelhantes, bairros, sitemap, lancamentos e condominios ainda dependem do legado | Validar cada consumidor antes de remover qualquer dependencia |
| Estoque/fotos | Aceite real disponivel para CA5278 e dez fotos; isso nao comprova paridade do catalogo inteiro | Curadoria e migracao das midias dos imoveis destinados ao Premium |
| Capacidade | API limita 120 JSON/minuto/IP; chamadas do servidor compartilham saida | Verificar carga prevista antes da troca; sem aumentar limites nesta entrega |

## Aceite futuro em previa

Previa isolada e nao indexavel, sem acionamento de cron ou escrita em bancos de producao. Conferir busca, ficha, URLs existentes, preco, fotos e estados vazio/erro. Indisponibilidade do CRM nao pode parecer estoque vazio nem acionar fallback silencioso ao legado. So depois da paridade aprovada, autorizar a troca em producao.

## Preparacao implementada

- `lib/crm-catalog.ts`: cliente GET de lista, detalhe por codigo e opcoes de filtros. Origem HTTPS fixa, sem cookies/credenciais, redirects recusados, timeout de 10 segundos e corpo limitado a 5 MiB. Sem cache adicional ou fallback ao banco legado.
- Projecao explicita de dados consumidos: codigo, negociacao, precos/areas decimais, unidade de area, localizacao publica, taxonomia, ambientes, titulo/descricao e fotos do proxy oficial Premium. Campos extras da resposta sao descartados, nao espalhados no DTO. Validacao manual em runtime; sem novas dependencias.
- Esta primeira projecao nao inclui caracteristicas dinamicas nem videos. A API atual entrega somente fotos prontas. Incluir caracteristicas e decidir suporte a videos antes da paridade; nao conectar silenciosamente este subconjunto como substituto da ficha completa.
- Nao ha componente, pagina de previa ou chamada nova nas paginas atuais. O cliente e uma fronteira preparatoria, nao a integracao concluida. URLs/slugs nao sao gerados por este modulo.
- `npm run test:crm-catalog`: testes sinteticos de strings decimais, quantidades zero, exclusao de campos privados, fotos seguras, erros, 404, filtros nao suportados e ausencia de cache. `--live` confirmou GET real do CA5278 com dez fotos, sem baixar as fotos nem modificar imoveis.
- Nenhuma variavel de ambiente, configuracao Vercel, migracao, banco ou importador alterado. Build executado com DATABASE_URL vazio somente no processo para impedir acesso ao banco do site; arquivo de ambiente preservado.
- Resultado: testes locais e GET publico aprovados; `tsc --noEmit --incremental false` aprovado. Build completo interrompido apos permanecer sem progresso visivel; causa nao determinada e build nao aprovado. Validacao navegavel ainda nao executada, pois esta entrega nao conecta paginas. `git diff --check` sem erros.

## Previa local do CA5278

- Usuario executou consultas READ ONLY nos dois bancos. Capturas do Premium: 2.419 registros, todos com codigo/slug, todos com codigo no padrao publico e sufixo correspondente no slug. Nenhum auxiliar no padrao publico. Isso nao prova correspondencia global entre bancos.
- CA5278: assinatura do identificador de origem coincidiu entre Premium e CRM; origem external no CRM. Viculo do piloto confirmado; slug completo nao foi coletado e nao foi inventado.
- Rota local `http://localhost:3004/preview/crm/CA5278` consome exclusivamente GET da API. Rotas/URLs existentes e consultas legadas inalteradas. Reutiliza LancamentoGallery/GalleryLightbox, sem next/image ou cache intermediario para fotos, e formata decimais sem Number.
- Disponivel somente em development sem marcadores Vercel, com bloqueio no middleware e na pagina. Retorna 404 fora desse ambiente. Middleware aplica no-store/noindex/nofollow/no-referrer. Nao integra sitemap. Layout evita Header/Footer com consultas legadas e Analytics somente nesta previa. Sem formulario, contato, evento de visualizacao, banco, slug gerado ou propriedade ficticia.
- Servidor local iniciado em 127.0.0.1:3004. VERCEL, VERCEL_ENV e DATABASE_URL vazios somente no processo; arquivos de ambiente inalterados. Processo identificado como production foi recusado com 404 antes do isolamento, conforme gate.
- Testes do cliente e formatacao/gate aprovados, TypeScript e build completo aprovados nesta etapa. Build com rede para fonte e DATABASE_URL vazio no processo. Supera a pendencia anterior de build interrompido; nao representa deploy.
- Edge automatizado: HTTP 200 com dados reais, headers sem cache/noindex, galeria abriu/avancou/fechou; seis imagens visiveis desktop carregadas (logo + cinco fotos), dez fotos na galeria. Capturas desktop 1440px e mobile 390px, sem overflow horizontal. Ajuste local de min-height eliminou sobreposicao da galeria; imagem e secao terminam na mesma coordenada, titulo abaixo. Nao houve auditoria de todas as fotos em tamanho completo.
- Anomalias observadas, sem corrigir dados: IPTU de 0.01; seis banheiros estruturados versus sete mencionados na descricao. Exigem curadoria, nao inferencia automatica.
- Ainda fora desta previa: paridade visual integral da ficha, contatos, semelhantes, caracteristicas dinamicas, videos, filtros e transicao de URLs. Sem commit/push/deploy; site de producao nao foi alterado.
