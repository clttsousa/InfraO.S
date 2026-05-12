-- InfraOS V6.7 — Intervenções Programadas
-- Execute após as migrations anteriores.

create extension if not exists pgcrypto;

-- Amplia a auditoria forte para registrar eventos do módulo Intervenções.
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'audit_events_entity_type_check'
      and table_name = 'audit_events'
  ) then
    alter table audit_events drop constraint audit_events_entity_type_check;
  end if;

  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'audit_events_scope_check'
      and table_name = 'audit_events'
  ) then
    alter table audit_events drop constraint audit_events_scope_check;
  end if;
end $$;

alter table audit_events
  add constraint audit_events_entity_type_check
  check (entity_type in ('service_order', 'internal_user', 'technician', 'system', 'infra_event'));

alter table audit_events
  add constraint audit_events_scope_check
  check (scope in ('order', 'user', 'technician', 'system', 'intervention'));

create table if not exists infra_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'OUTRO' check (type in ('TROCA_POSTES', 'MANUTENCAO_ELETRICA', 'DESLIGAMENTO_PROGRAMADO', 'OBRA_TERCEIROS', 'REMANEJAMENTO_REDE', 'OUTRO')),
  location_name text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'PROGRAMADO' check (status in ('PROGRAMADO', 'EM_ACOMPANHAMENTO', 'CONCLUIDO', 'CANCELADO', 'ATRASADO')),
  source text not null default 'WHATSAPP' check (source in ('WHATSAPP', 'EMAIL', 'TELEFONE', 'INTERNO', 'OUTRO')),
  original_message text,
  notes text,
  responsible_user_id uuid references internal_users(id) on delete set null,
  created_by uuid references internal_users(id) on delete set null,
  updated_by uuid references internal_users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint infra_events_time_check check (end_at > start_at)
);

create table if not exists infra_event_points (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references infra_events(id) on delete cascade,
  label text not null,
  maps_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_infra_events_start_at on infra_events(start_at);
create index if not exists idx_infra_events_end_at on infra_events(end_at);
create index if not exists idx_infra_events_status on infra_events(status);
create index if not exists idx_infra_events_type on infra_events(type);
create index if not exists idx_infra_events_source on infra_events(source);
create index if not exists idx_infra_events_location_lower on infra_events (lower(location_name));
create index if not exists idx_infra_events_responsible on infra_events(responsible_user_id);
create index if not exists idx_infra_events_archived_at on infra_events(archived_at);
create index if not exists idx_infra_event_points_event_id on infra_event_points(event_id);
create index if not exists idx_audit_events_infra_events on audit_events(entity_type, entity_id, created_at desc) where entity_type = 'infra_event';

create or replace trigger trg_infra_events_updated_at
before update on infra_events
for each row
execute function set_updated_at();

create or replace trigger trg_infra_event_points_updated_at
before update on infra_event_points
for each row
execute function set_updated_at();

comment on table infra_events is 'Intervenções programadas recebidas por WhatsApp, e-mail, telefone ou cadastro interno.';
comment on table infra_event_points is 'Pontos/localizações vinculados a uma intervenção programada.';
comment on column infra_events.original_message is 'Mensagem original colada do WhatsApp ou canal de origem para rastreabilidade.';
