# CRM Inglaterra — Plano de Arquitetura

**Documento de decisões confirmadas do CRM administrativo** · Set/2026

Este documento registra o escopo arquitetural do CRM/admin da Inglaterra Premium. Ele complementa `docs/inglaterra-premium-spec-tecnica.md` e `docs/plano-implementacao-codex.md`.

---

## Decisões confirmadas

- **Domínio oficial do CRM**: `https://admin.inglaterrapremium.com`
- **Decisão de domínio**: resolvida.
- **Importação de imóveis**: o CRM deve importar imóveis via XML de qualquer sistema/CRM fornecedor, sem dependência estrutural da Kenlo.
- **Fonte inicial/legada**: Kenlo/ValueGaia pode permanecer como o primeiro fornecedor atendido, porque é a fonte XML utilizada atualmente. Ela não deve definir o modelo interno do catálogo, da API ou da interface.

---

## Arquitetura de importação XML

A importação de imóveis deve ser tratada como **Sincronização de fonte externa**, com uma camada de adaptação antes de gravar no catálogo interno.

Fluxo conceitual:

```text
Fonte XML externa
  -> Adaptador do fornecedor/formato
  -> Contrato interno normalizado
  -> Regras do catálogo e curadoria
  -> Postgres
  -> API e interface do CRM/site
```

### Contrato interno normalizado

O sistema deve converter os dados recebidos de cada XML para um contrato interno estável antes de aplicar regras de catálogo, filtro premium, curadoria manual ou exibição pública.

Esse contrato interno é a fronteira entre fornecedores externos e produto. Portanto:

- nomes de campos, formatos e particularidades do XML não devem vazar para a interface;
- regras de negócio do catálogo não devem depender diretamente da estrutura de um fornecedor específico;
- troca de CRM de origem não deve exigir remodelar páginas, API pública, formulários administrativos ou consultas principais.

### Adaptadores por fornecedor/formato

Cada fornecedor ou formato XML deve ter seu próprio adaptador responsável por:

- baixar ou receber o XML;
- parsear o formato específico;
- mapear campos para o contrato interno normalizado;
- preservar identificadores de origem para upsert e rastreabilidade;
- registrar erros de importação sem quebrar a experiência pública.

### Primeiro adaptador

O primeiro adaptador deve cobrir a fonte XML utilizada atualmente, historicamente Kenlo/ValueGaia.

Essa implementação inicial deve ser nomeada e documentada como adaptador de fonte XML externa ou adaptador legado Kenlo/ValueGaia, nunca como arquitetura central do CRM.

### Troca de CRM de origem

A arquitetura deve permitir trocar o CRM fornecedor criando ou substituindo adaptadores, mantendo estáveis:

- catálogo interno de imóveis;
- filtros e curadoria;
- API consumida pelo site público;
- telas administrativas;
- rotas públicas e SEO.

---

## Vocabulário recomendado

Use preferencialmente:

- **Importação XML**
- **Sincronização de fonte externa**
- **Adaptador XML**
- **Contrato interno normalizado**
- **Fonte inicial/legada Kenlo/ValueGaia**

Evite tratar `Sync Kenlo` ou `Kenlo` como nome permanente da arquitetura. Kenlo pode aparecer apenas como referência à origem inicial/legada.
