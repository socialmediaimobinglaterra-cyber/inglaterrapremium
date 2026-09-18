create table if not exists openai_usage_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  modelo text not null,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  sucesso boolean not null,
  erro text
);
create index if not exists openai_usage_log_created_idx on openai_usage_log(created_at desc);
create table if not exists ai_search_rate_limits (
  chave text primary key,
  inicio timestamptz not null,
  tentativas integer not null,
  expira_em timestamptz not null
);
