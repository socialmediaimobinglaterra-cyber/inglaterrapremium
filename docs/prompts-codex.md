# Inglaterra Premium — Prompts para o Codex
**Prontos para copiar e colar, na ordem das fases** · v1.0 · Ago/2026

---

## Técnicas usadas nesses prompts (e por quê)

| Técnica | Por que evita loop/alucinação |
|---|---|
| **Um objetivo por prompt** | Modelo de código funciona melhor com escopo fechado. Múltiplos objetivos = ele prioriza errado e mistura decisões. |
| **Anexar arquivo, não descrever de memória** | Referenciar `App.tsx` em vez de explicar "o hero tem uma busca com fundo bege translúcido..." elimina ambiguidade — o Codex lê o código exato, não uma paráfrase que pode perder detalhe. |
| **Restrições negativas explícitas ("não faça X")** | Modelos tendem a "ajudar demais" — corrigir coisas que não foram pedidas. Dizer o que NÃO mexer é tão importante quanto dizer o que fazer. |
| **Pedir resumo ao final** | Força o modelo a reportar o que decidiu — se ele fez algo diferente do esperado, aparece no resumo em vez de ficar escondido no código. |
| **Critério de aceite explícito** | Sem isso, "terminado" vira subjetivo. Com isso, dá pra checar objetivamente. |
| **Proibir decisão de arquitetura autônoma** | Já temos as decisões (stack, banco, filtro) documentadas. O papel do Codex é executar, não redesenhar — repetir isso em cada prompt reduz a chance de ele "sugerir uma abordagem melhor" no meio da tarefa. |
| **Prompts curtos e objetivos** | Prompt longo dilui atenção do modelo nos pontos que mais importam. Preferimos referenciar os documentos por nome a colar o conteúdo inteiro de novo em cada prompt. |

**Fluxo 100% GitHub (sem nada local)**: como definimos na Fase 0 do plano de implementação, você trabalha com o **Codex Cloud** — não o CLI local. Isso muda um detalhe pequeno mas importante nesses prompts: em vez de "anexar" os arquivos `.tsx`, `inglaterra-premium-spec-tecnica.md` e `plano-implementacao-codex.md` numa conversa, **suba todos eles pro repositório GitHub antes do primeiro prompt** (ex. numa pasta `docs/` e `prototypes/`). O Codex Cloud lê o repositório inteiro por conta própria — só referencie o nome do arquivo no prompt ("conforme `docs/inglaterra-premium-spec-tecnica.md`"), sem precisar reanexar nada a cada tarefa nova.

---

## FASE 1 — Fundação técnica

```
Leia primeiro inglaterra-premium-spec-tecnica.md e plano-implementacao-codex.md
(no repositório). As decisões de arquitetura já estão definidas nesses documentos —
não decida stack, banco ou estrutura por conta própria.

OBJETIVO ÚNICO desta tarefa: criar o scaffold Next.js 15 (App Router) +
TypeScript + Tailwind CSS, e recriar os componentes Header e Footer com
fidelidade visual ao arquivo App.tsx do repositório (protótipo Figma Make).

Preservar exatamente: paleta de cores (#101a26, #51210d, #d98a4e, #998376,
#F5F3F0), tipografia DM Sans (nenhuma outra fonte), fundo bege nas páginas
(não branco), menu mobile com hambúrguer, os dois dropdowns de navegação
(Lançamentos/Condomínios) abrindo no hover.

NÃO crie nenhuma página de conteúdo ainda. NÃO use fontes além de DM Sans.
NÃO altere a paleta ou proponha uma nova.

Critério de aceite: uma página em branco publicada com Header e Footer
idênticos ao protótipo, funcionando em mobile e desktop.

Ao terminar, resuma o que foi criado e onde encontrar cada arquivo.
```

---

## FASE 2 — Banco de dados + pipeline do XML

```
OBJETIVO ÚNICO desta tarefa: banco de dados e sincronização com a Kenlo.
Nenhuma página deve consumir esses dados ainda.

Crie o schema Postgres conforme a seção 5 de inglaterra-premium-spec-tecnica.md:
tabelas imoveis, bairros, lancamentos, condominios, configuracoes_premium,
sincronizacoes_log.

Crie o script de sincronização (cron job): busca o XML da Kenlo em
[COLAR URL AQUI], parseia os imóveis, aplica o filtro premium (valor mínimo
+ lista de bairros, lidos de configuracoes_premium — não fixos no código) e
grava no banco. Cada execução deve gerar um registro em sincronizacoes_log
com quantos imóveis entraram/saíram.

NÃO crie nenhuma rota ou página que use esses dados nesta tarefa.

Critério de aceite: rodar a sincronização manualmente uma vez e mostrar uma
amostra real dos dados gravados no banco.
```

---

## FASE 3 — Páginas principais

> ⚠️ **Antes do prompt 3.2**: decida se a busca por IA vai usar um modelo de linguagem de verdade nesta primeira versão, ou se lança só com os filtros manuais (a versão do protótipo é uma simulação por regex, sem custo de API). Ajuste o prompt 3.2 conforme a decisão.

### 3.1 — Home
```
Fase 3.1: Home.

Recrie a Home em app/page.tsx, usando o Header/Footer já existentes no
projeto (não recrie do zero). Use App.tsx (no repositório) como referência visual
exata — layout, espaçamento, hierarquia, textos.

Troque os dados de exemplo (imóveis em destaque, bairros) por consultas
reais às tabelas imoveis e bairros. Textos institucionais fixos (diretoria,
diferenciais) podem continuar como estão por enquanto.

Aplique metadata (title/description) conforme a seção 7 de
inglaterra-premium-spec-tecnica.md.

NÃO redesenhe nada. Se algo no protótipo parecer estranho ou incompleto,
pergunte antes de mudar por conta própria.

Critério de aceite: Home publicada, visualmente idêntica ao protótipo,
com imóveis e bairros reais vindos do banco.

Ao terminar, resuma o que foi conectado ao banco e o que ainda está fixo.
```

### 3.2 — Busca de imóveis
```
Fase 3.2: Busca de Imóveis.

Recrie em app/imoveis/page.tsx, usando BuscaImoveis.tsx (no repositório) como
referência visual exata. Header/Footer já existem — reutilize.

Filtros (bairro, tipo, valor, suítes) devem consultar a tabela imoveis
de verdade, com resultados reativos.

[SE decidiu IA real nesta fase:] A busca por linguagem natural deve chamar
[nome do provedor/modelo escolhido] para interpretar a frase e extrair os
mesmos filtros (bairro, tipo, suítes, valor). Trate erros de forma graciosa
(se a IA falhar, caia nos filtros manuais).

[SE decidiu adiar a IA:] Mantenha por enquanto só os filtros manuais
(chips). Deixe um comentário no código indicando onde a busca por IA vai
entrar depois — não implemente a simulação por regex do protótipo em
produção.

NÃO redesenhe o layout dos cards ou da barra de filtros.

Critério de aceite: busca funcional com dados reais, mobile e desktop
idênticos ao protótipo.
```

### 3.3 — Ficha do imóvel
```
Fase 3.3: Ficha do Imóvel.

Crie a rota dinâmica app/imoveis/[slug]/page.tsx usando FichaImovel.tsx
(no repositório) como referência visual exata. Header/Footer já existem — reutilize.

Todos os dados (galeria, preço, fatos, diferenciais, imóveis semelhantes)
devem vir da tabela imoveis pelo slug da URL. Gere os slugs a partir do
título + id do imóvel (nunca reaproveite slug de imóvel removido).

Aplique metadata dinâmica por imóvel (title, description, Open Graph) e o
schema JSON-LD RealEstateListing conforme a seção 7 do documento técnico.

NÃO redesenhe o layout. NÃO invente campos que não existem na tabela —
se faltar um dado usado no protótipo (ex: nome do corretor), pergunte
antes de improvisar.

Critério de aceite: abrir a ficha de 3 imóveis reais diferentes e conferir
que os dados batem com o banco.
```

### 3.4 — Página de bairro
```
Fase 3.4: Página de Bairro.

Crie a rota dinâmica app/bairros/[slug]/page.tsx usando PaginaBairro.tsx
(no repositório) como referência visual exata. Header/Footer já existem — reutilize.

Texto institucional do bairro e os 3 números (valor médio, valorização,
imóveis disponíveis) vêm da tabela bairros. Grid de imóveis do bairro e
"outros bairros" vêm de consultas reais.

Aplique metadata dinâmica por bairro e o schema JSON-LD FAQPage se houver
perguntas frequentes cadastradas para o bairro.

NÃO redesenhe o layout.

Critério de aceite: abrir a página de 2 bairros diferentes (ex: Gleba
Palhano e Bela Suíça) e conferir que os números e imóveis batem com o
banco.
```

---

## FASE 4 — Páginas de produto

### 4.1 — Lançamentos
```
Fase 4.1: Lançamentos.

Crie a rota dinâmica app/lancamentos/[slug]/page.tsx usando
LancamentoDetalhe.tsx (no repositório) como referência visual exata — incluindo a
seção "sobre", galeria, localização e "quem viu também viu".

A lista que alimenta o dropdown "Lançamentos" no Header (já existente)
deve vir da mesma tabela lancamentos, não fixa no componente — atualize o
Header para buscar essa lista dinamicamente.

NÃO redesenhe o layout nem o dropdown.

Critério de aceite: dropdown do menu mostra os lançamentos reais
cadastrados; cada um abre a página individual correta.
```

### 4.2 — Condomínios
```
Fase 4.2: Condomínios.

Mesma lógica da Fase 4.1, agora para condomínios: rota dinâmica
app/condominios/[slug]/page.tsx usando PaginaCondominio.tsx (no repositório) como
referência. Dropdown "Condomínios" no Header passa a buscar a lista real
da tabela condominios.

NÃO redesenhe o layout.

Critério de aceite: dropdown mostra os condomínios reais cadastrados;
cada um abre a página individual correta.
```

### 4.3 — BTS
```
Fase 4.3: Inglaterra BTS.

Crie app/bts/page.tsx usando PaginaBTS.tsx (no repositório) como referência visual
exata. Esta é uma página única (sem rota dinâmica, sem dropdown no menu —
BTS é um serviço, não uma lista).

Os cases de sucesso e os números (contratos ativos, área construída,
contrato médio) podem ficar como conteúdo editável manualmente por
enquanto (não precisam de tabela própria), a menos que vocês decidam
depois transformar isso em um catálogo de projetos.

NÃO redesenhe o layout. NÃO adicione dropdown ao item "BTS" do menu.

Critério de aceite: página publicada, idêntica ao protótipo, com o
formulário de contato funcional (envia para [e-mail ou CRM definido]).
```

---

## Depois da Fase 4

As Fases 5, 6 e 7 (páginas institucionais restantes, SEO técnico, QA/publicação) dependem de conteúdo que ainda não foi prototipado ou de decisões finais (ferramenta de e-mail, textos reais dos diretores). Quando chegarmos lá, volto a montar os prompts no mesmo formato.
