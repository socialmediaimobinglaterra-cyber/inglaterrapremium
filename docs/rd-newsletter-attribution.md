# Newsletter: origem no RD

- Conversao permanece `inglaterra-premium-newsletter`; tags permanecem `inglaterra-premium` e `newsletter`.
- `utm_source`, `utm_medium`, `utm_campaign` da entrada viram `traffic_source`, `traffic_medium`, `traffic_campaign` no payload oficial do RD.
- Sem UTM valida, envia somente o dominio do referrer externo como referral. Sem referrer, usa `(direct)` / `(none)`; isso nao prova que nao houve uma campanha, pois navegadores podem ocultar a referencia.
- Entrada por navegacao interna sem origem identificavel e chamadas API sem atribuicao nao inventam uma origem.
- A entrada e mantida apenas em memoria durante a navegacao Next.js. Recarregar a pagina perde esse contexto; nao usamos cookies, localStorage ou rastreamento entre sessoes.
- Atribuicao so e enviada ao submeter a newsletter com consentimento. O servidor valida uma lista fechada de campos, cada um com ate 120 caracteres. Nao envia URL completa, termos de busca, identificadores de clique ou historico.
- Credenciais, deduplicacao, consentimento e tratamento de erros existentes permanecem inalterados. Outros formularios nao foram modificados nesta tarefa.

## Validacao de producao (apos aprovacao da PR)

1. Abrir o site com `?utm_source=instagram&utm_medium=paid_social&utm_campaign=premium_newsletter`.
2. Com autorizacao, cadastrar um email de teste e verificar os detalhes da nova conversao no RD. Um email ja enviado pode ser deduplicado por 24h.
3. Conferir que o identificador e `inglaterra-premium-newsletter`. `site-matriz-newsletter` nao existe no codigo desta branch; comparar a implantacao efetiva e eventuais automacoes da conta se continuar aparecendo.
4. Conversoes antigas nao sao reescritas; a origem inicial de um contato existente pode continuar diferente da origem da nova conversao.

Referencia: https://developers.rdstation.com/reference/conversao (campos traffic_source, traffic_medium e traffic_campaign do payload via API Key).
