# Fase 5.0 — Fundação do painel Admin

Esta fase é escopo novo, acrescentado depois do plano original.

## Escopo implementado

- Autenticação do `/admin` por e-mail e código de 6 dígitos, sem senha.
- Apenas e-mails cadastrados em `admin_users` podem solicitar código.
- Envio de código por Resend via `RESEND_API_KEY`.
- Sessão assinada em cookie `httpOnly`, com expiração de 7 dias.
- Middleware protegendo `/admin/**`.
- Dois papéis:
  - `admin`: pode editar conteúdo futuramente e convidar usuários.
  - `editor`: pode editar conteúdo futuramente, sem acesso a convites.
- `/admin/usuarios` restrito a `admin`, com lista de usuários e convite por e-mail.

## Fora do escopo desta fase

- Cadastro ou edição de lançamentos.
- Cadastro ou edição de condomínios.
- Cadastro ou edição de bairros.
- Qualquer formulário de conteúdo.
