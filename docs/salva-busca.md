# Salva busca: Central + RD Station Marketing

## Escopo

O botao da busca publica abre um formulario com nome, email, WhatsApp brasileiro
com DDD e consentimento obrigatorios. Usa um snapshot dos filtros atuais, sem
historico da IA, catalogo, imagens ou dados de imoveis. Nao cria conta de usuario
nem alertas automaticos. O atendimento e feito pela equipe.

Selecoes temporarias do mapa nao sao salvas: o formulario orienta escolher bairro
ou condominio. A previa CRM nao envia leads. Nao altera filtros nem elegibilidade.

## Configuracao de producao (painel da Vercel)

- `CENTRAL_INTEGRATION_TOKEN`: segredo do webhook, enviado em X-Integration-Token.
- `RD_STATION_API_KEY`: chave do aplicativo RD Station Marketing.
- `DATABASE_URL`: Postgres ja usado para controles operacionais da busca IA.

Nao usar variaveis NEXT_PUBLIC. Nao registrar URLs RD em logs: a API RD exige a
chave na query string. Nao usar Vercel CLI para configurar ou publicar.

Central: `https://atendimento.imobiliariainglaterra.com.br/api/public/integrations/inbound`.
A caixa deve estar vinculada e EXTERNAL_INTEGRATIONS_ENABLED ativo na central.
Nome/email/phone/source/tags/interest/notes seguem o contrato enviado pelo cliente.
O texto e a data do consentimento acompanham notes.

RD: conversao `inglaterra-premium-salva-busca`, usando campos padrao name, email,
mobile_phone, tags e legal_bases. Os criterios sao etiquetas `busca: Campo: valor`,
sem exigir campos personalizados. As etiquetas representam interesses acumulados,
NAO o perfil atual exclusivo; uma nova conversao registra os criterios enviados.
Nao configurar retorno dessa mesma conversao do RD para esta central sem deduplicacao:
o site ja envia diretamente aos dois destinos.

## Entrega e protecao

O Postgres cria duas tabelas aditivas no primeiro uso, seguindo o padrao operacional
existente: saved_search_delivery e saved_search_quota. O usuario do banco precisa
permitir CREATE TABLE. Nao armazena nomes, telefones, emails ou filtros em claro;
grava HMAC do perfil/contato, protocolo UUID, versao/data do consentimento e estados.
Os contatos/perfis completos ficam nos destinos autorizados pelo formulario.

Limites atomicos compartilhados entre instancias: 5 tentativas por IP/10 minutos,
10 por telefone/dia, 100 globais/hora. IP vem do cabecalho da Vercel. Fora da Vercel,
todos usam o bucket local. Corpo limitado a 8 KB, origem mesma do endpoint,
validacao no servidor, timeout de 10s por destino, sem redirecionamentos.

Mesmo telefone/email/filtros/versao nao reenvia destinos confirmados por 24h.
Lock Postgres impede envios concorrentes. Falha explicita pode ser reenviada
manualmente pelo formulario quando recuperavel (429). Rejeicoes 4xx e error/ignored
na central sao terminais, com protocolo para atendimento. Resultado ambiguo (timeout, 5xx, resposta inesperada)
NAO e reenviado automaticamente: apresenta protocolo para conciliacao humana.
Nao existe garantia exactly-once nos provedores nem fila automatica neste escopo.
Trocar o token central muda os HMACs; conciliar pendencias antes da rotacao.
Registros vencidos ha mais de 30 dias sao limpos no uso; quotas vencidas ha um dia.

RD so confirma com event_uuid. Central so confirma com ok:true, result created/updated
e conversation_id preenchido, conforme exemplos de contrato fornecidos pelo cliente.
HTTP 200 com result error/ignored e rejeitado, mesmo com ok:true.
HTTP 200 isolado NAO comprova atendimento aberto. Resposta desconhecida fica pendente.

Logs: saved_search_delivery com protocolo, destino e estado, sem PII/segredos.
Consulta operacional: saved_search_delivery pelo campo reference; investigar o
mesmo protocolo nas observacoes da central. RD pode ser localizado pelo contato.

## Aceite antes da liberacao

1. Confirmar mapeamento interest/notes/tags na integracao da central.
2. Validar com contato de teste autorizado nos dois sistemas, sem usar dados ficticios
   de terceiros. Conferir abertura da caixa, criterios e consentimento.
3. Repetir envio e verificar ausencia de nova conversao/acionamento duplicado.
4. Confirmar que automacoes RD existentes nao reenviam o mesmo lead a esta central.
5. Simular falha parcial em teste isolado; somente destino falho pode ser reenviado.
6. Conferir credenciais e DATABASE_URL no painel, nunca em screenshots ou PR.

Documentacao RD consultada:
- https://developers.rdstation.com/reference/conversao
- https://developers.rdstation.com/reference/evento-de-conversao-via-api-key
- https://developers.rdstation.com/reference/campos-personalizados
