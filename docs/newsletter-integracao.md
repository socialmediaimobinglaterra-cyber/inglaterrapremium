# Newsletter e contatos oficiais

## Configuracao

Os destinos de avaliacao, candidatura, WhatsApp e telefone ficam em
`lib/contact-settings.ts`. Nenhum token deve ser colocado nesse arquivo publico.

A newsletter usa `POST /api/newsletter` e reutiliza `sendLead` da integracao
existente com o RD Station Marketing. Nao envia dados para a Central de Atendimento.

Variaveis server-only necessarias no painel da Vercel:

- `RD_STATION_API_KEY`: chave da conta RD Station Marketing ja utilizada pelo Salva busca.
- `DATABASE_URL`: conexao Postgres ja utilizada pelo Salva busca, com permissao de
  criar e consultar as tabelas `rd_contact_delivery` e `rd_contact_quota`.

Sem essas configuracoes, a API retorna 503; nao ha sucesso simulado. A existencia
e validade das variaveis em producao devem ser conferidas pelo responsavel no
painel da Vercel. Nao foram utilizados contatos reais nos testes automatizados.

## Cadastro

- Conversao: `inglaterra-premium-newsletter`.
- Tags: `inglaterra-premium`, `newsletter`.
- Campos: email normalizado e base legal de comunicacao por consentimento.
- Checkbox desmarcado inicialmente e obrigatorio no cliente e servidor.
- Consentimento: texto/versionamento em `lib/newsletter.ts`, com data no Postgres.
- Sucesso apenas quando RD retorna `event_uuid`, conforme a
  [documentacao oficial](https://developers.rdstation.com/reference/conversao).
- A conversao cria/atualiza o contato no RD; o envio de campanhas e o link de
  descadastro devem ser administrados pelo Marketing na conta RD.

## Repeticao e falhas

O Postgres guarda um HMAC do email (nao o email em texto), estado e consentimento.
O mesmo email/versao nao gera nova conversao por 24 horas apos confirmacao.
Uma trava no banco impede duas requisicoes simultaneas. O limite e de 10 tentativas
por IP a cada 10 minutos e 200 globais por hora.

Antes de enviar ao RD, persiste o estado `uncertain`. Timeout, erro 5xx ou resposta
sem comprovante nao geram sucesso nem reenvio automatico durante essa janela.
Uma rejeicao explicita permite nova tentativa, sujeita aos limites. Apos 24 horas,
uma nova inscricao explicita pode gerar outra conversao (por exemplo, reinscricao).
Isso nao promete entrega de campanhas nem confirma propriedade do email.

Nenhum email, IP em texto ou credencial e registrado nos logs. Os registros de
controle expirados sao removidos apos 30 dias; a chave RD participa do HMAC, entao
sua rotacao reinicia a deduplicacao local. A confirmacao de cadastro e separada de
confirmacao de entrega de email.

## Contato da ficha do imovel

Excecao aprovada ao WhatsApp geral: a ficha continua abrindo `wa.me` para o numero
do corretor cadastrado. Sem numero valido, o botao usa o canal oficial geral.
O telefone exibido na ficha permanece o institucional padronizado.

O formulario agora exige email e consentimento proprio (`contato-imovel-v2`), sem
inscrever o interessado na newsletter. `POST /api/imoveis/contato` valida o imovel
no catalogo e envia somente ao RD, nunca a Central. Usa o mesmo controle de
repeticao/limites da newsletter, separado por email, telefone, imovel e finalidade.
Nenhuma alteracao foi feita no fluxo existente de Salva busca.

- Conversao: `inglaterra-premium-contato-imovel`.
- Dados RD: nome, email, telefone, referencia do imovel e finalidade nas tags,
  alem da base legal de consentimento.
- Mensagem preenchida: mantida no WhatsApp do corretor com referencia e link do
  imovel; nao depende de campos personalizados no RD.
- O WhatsApp abre no clique para evitar bloqueio de popup; o cadastro RD ocorre
  separadamente. O site nunca afirma ter enviado a mensagem pelo WhatsApp.
- Falha ou resposta incerta do RD permanece visivel; um link permite reabrir a
  conversa sem gerar outro cadastro. Nao ha envio automatico de mensagem.

## Avaliacao e candidatura

Os botoes agora navegam para as paginas fornecidas pelo responsavel. O layout dos
campos existentes de avaliacao foi preservado; os dados preenchidos nessa secao
nao sao transmitidos por URL nem simulam cadastro. O cadastro ocorre na landing
page de captacao. O link Seja Corretor no rodape usa o mesmo destino de candidatura.

## Checklist para homologacao

1. Revisar e aprovar a PR; nenhuma publicacao em producao e feita por esta tarefa.
2. Conferir no painel Vercel as duas variaveis server-only nos ambientes desejados
   e a permissao do banco. Nao compartilhar os valores em chats/logs.
3. Com um contato de teste autorizado, testar newsletter e ficha do imovel e
   conferir as duas conversoes acima na conta RD correta.
4. Conferir que o interessado no imovel nao recebe a tag `newsletter` por esse
   fluxo. O site nao chama a Central nestes dois fluxos; caso a conta RD possua
   automacoes/webhooks globais que encaminham leads a Central, excluir estas
   conversoes dessas regras para preservar a separacao solicitada.
5. Configurar no RD a segmentacao/envio da newsletter e o descadastro das campanhas.
