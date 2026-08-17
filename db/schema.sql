create extension if not exists pgcrypto;

create or replace function ativo_no_site(
  elegivel_filtro_automatico boolean,
  inclusao_manual boolean
) returns boolean
language sql
immutable
as $$
  select coalesce(
    (
      elegivel_filtro_automatico = true
      and inclusao_manual is not false
    )
    or inclusao_manual = true,
    false
  );
$$;

create table if not exists bairros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  cidade text not null default 'Londrina',
  estado text not null default 'PR',
  descricao text,
  faq jsonb,
  imoveis_xml_bruto integer not null default 0,
  ativo boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bairros add column if not exists descricao text;
alter table bairros add column if not exists faq jsonb;

create table if not exists configuracoes_premium (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  bairros_permitidos text[] not null,
  valor_minimo_venda numeric(14,2),
  valor_minimo_locacao numeric(14,2),
  valor_minimo_pendente boolean not null default true,
  regra text not null,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint configuracoes_premium_valor_pendente_check
    check (
      valor_minimo_pendente
      or valor_minimo_venda is not null
      or valor_minimo_locacao is not null
    )
);

create table if not exists imoveis (
  id uuid primary key default gen_random_uuid(),
  origem text not null default 'kenlo' check (origem in ('kenlo', 'manual')),
  kenlo_id text,
  kenlo_codigo text unique,
  codigo_auxiliar text,
  slug text not null unique,
  titulo text not null,
  tipo text,
  subtipo text,
  finalidade text,
  categoria text,
  cidade text,
  estado text,
  bairro_id uuid references bairros(id) on delete set null,
  bairro_nome text,
  bairro_oficial text,
  endereco text,
  numero text,
  cep text,
  latitude numeric(18,14),
  longitude numeric(18,14),
  nome_condominio text,
  nome_edificio text,
  status_comercial text,
  tipo_oferta text,
  preco_venda numeric(14,2),
  preco_locacao numeric(14,2),
  preco_condominio numeric(14,2),
  preco_iptu numeric(14,2),
  area_util numeric(12,2),
  area_total numeric(12,2),
  dormitorios integer,
  suites integer,
  banheiros integer,
  vagas integer,
  descricao text,
  url_kenlo text,
  video_url text,
  corretor jsonb not null default '{}'::jsonb,
  fotos jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  elegivel_filtro_automatico boolean not null default false,
  inclusao_manual boolean,
  ativo_no_site boolean generated always as (
    ativo_no_site(elegivel_filtro_automatico, inclusao_manual)
  ) stored,
  is_premium boolean not null default false,
  is_premium_override boolean not null default false,
  premium_reason text,
  ativo boolean not null default true,
  last_seen_at timestamptz,
  kenlo_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table imoveis add column if not exists origem text not null default 'kenlo';
alter table imoveis add column if not exists kenlo_id text;
alter table imoveis add column if not exists elegivel_filtro_automatico boolean not null default false;
alter table imoveis add column if not exists inclusao_manual boolean;
alter table imoveis drop column if exists ativo_no_site;
alter table imoveis add column ativo_no_site boolean generated always as (
  ativo_no_site(elegivel_filtro_automatico, inclusao_manual)
) stored;
alter table imoveis alter column kenlo_codigo drop not null;
alter table imoveis drop constraint if exists imoveis_origem_check;
alter table imoveis add constraint imoveis_origem_check
  check (origem in ('kenlo', 'manual'));
update imoveis set origem = 'kenlo' where origem is null;
update imoveis
set elegivel_filtro_automatico = is_premium
where elegivel_filtro_automatico = false
  and is_premium = true;
update imoveis
set kenlo_id = kenlo_codigo
where origem = 'kenlo'
  and kenlo_id is null
  and kenlo_codigo is not null;

create table if not exists condominios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  bairro_id uuid references bairros(id) on delete set null,
  bairro_nome text,
  cidade text not null default 'Londrina',
  estado text not null default 'PR',
  imoveis_count integer not null default 0,
  raw jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lancamentos (
  id uuid primary key default gen_random_uuid(),
  kenlo_codigo text unique,
  nome text not null,
  slug text not null unique,
  bairro_id uuid references bairros(id) on delete set null,
  bairro_nome text,
  cidade text not null default 'Londrina',
  estado text not null default 'PR',
  imovel_id uuid references imoveis(id) on delete set null,
  raw jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sincronizacoes_log (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  xml_url text not null,
  total_xml integer not null default 0,
  total_bairros_permitidos integer not null default 0,
  total_premium integer not null default 0,
  imoveis_entraram integer not null default 0,
  imoveis_sairam integer not null default 0,
  valor_minimo_pendente boolean not null default true,
  bairros_contagem jsonb not null default '{}'::jsonb,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists imoveis_bairro_nome_idx on imoveis (bairro_nome);
create index if not exists imoveis_ativo_premium_idx on imoveis (ativo, is_premium);
create index if not exists imoveis_ativo_site_idx on imoveis (ativo, ativo_no_site);
create index if not exists imoveis_elegivel_filtro_automatico_idx on imoveis (elegivel_filtro_automatico);
create index if not exists imoveis_preco_venda_idx on imoveis (preco_venda);
create index if not exists imoveis_preco_locacao_idx on imoveis (preco_locacao);
create index if not exists sincronizacoes_log_started_at_idx on sincronizacoes_log (started_at desc);

-- Fase 5.0: fundação do painel Admin (escopo novo fora do plano original).
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('admin', 'editor')),
  invited_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists admin_login_codes (
  email text not null references admin_users(email) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists admin_login_codes_email_idx
  on admin_login_codes (email, expires_at desc);

insert into admin_users (email, role)
values ('socialmedia@imobiliariainglaterra.com.br', 'admin')
on conflict (email) do update set role = excluded.role;

insert into configuracoes_premium (
  chave,
  bairros_permitidos,
  valor_minimo_venda,
  valor_minimo_locacao,
  valor_minimo_pendente,
  regra,
  observacoes
) values (
  'criterios_premium',
  array[
    'Terra Bonita',
    'Gleba Palhano',
    'Aurora',
    'Bela Suíça',
    'Nova Prochet',
    'Jardim Higienópolis'
  ],
  null,
  null,
  true,
  'E (bairro permitido E valor mínimo configurado) OU is_premium_override = true. Valor mínimo ainda pendente: não aplicar corte de preço até definição comercial.',
  'PLACEHOLDER: definir valor_minimo_venda e/ou valor_minimo_locacao antes do corte final de premium.'
) on conflict (chave) do update set
  bairros_permitidos = excluded.bairros_permitidos,
  regra = excluded.regra,
  observacoes = excluded.observacoes,
  updated_at = now();
