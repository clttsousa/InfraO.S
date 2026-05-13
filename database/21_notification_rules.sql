-- InfraOS V6.18.0 — Motor de Notificações Inteligentes
-- Execute após database/20_performance_indexes.sql.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Compatibilidade: amplia a tabela existente de notificações sem perder dados.
alter table app_notifications
  drop constraint if exists app_notifications_type_check;

alter table app_notifications
  add column if not exists severity text not null default 'info',
  add column if not exists entity_type text,
  add column if not exists entity_id uuid,
  add column if not exists action_url text,
  add column if not exists action_label text,
  add column if not exists group_key text,
  add column if not exists rule_id uuid,
  add column if not exists muted_until timestamptz,
  add column if not exists snoozed_until timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table app_notifications
  add constraint app_notifications_type_check
  check (type in (
    'intervention_reminder', 'intervention_today', 'intervention_late',
    'order_unassigned', 'order_assigned', 'order_due_soon', 'order_late', 'order_stale',
    'order_status_changed', 'order_reopened', 'order_canceled',
    'intervention_tomorrow', 'intervention_not_concluded', 'intervention_canceled', 'intervention_reminder_pending',
    'system_cron_failed', 'system_notification_error', 'system_login_failed', 'system_user_created', 'system_role_changed',
    'smart_rule'
  ));

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'app_notifications_severity_check') then
    alter table app_notifications
      add constraint app_notifications_severity_check
      check (severity in ('info', 'attention', 'important', 'critical'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'app_notifications_entity_type_check') then
    alter table app_notifications
      add constraint app_notifications_entity_type_check
      check (entity_type is null or entity_type in ('order', 'intervention', 'system'));
  end if;
end $$;

create table if not exists notification_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_type text not null,
  entity_type text not null check (entity_type in ('order', 'intervention', 'system')),
  conditions jsonb not null default '{}'::jsonb,
  severity text not null default 'info' check (severity in ('info', 'attention', 'important', 'critical')),
  recipient_strategy jsonb not null default '["admins"]'::jsonb,
  channels jsonb not null default '["internal"]'::jsonb,
  template text not null,
  action_label text,
  action_url_template text,
  cooldown_minutes integer not null default 60 check (cooldown_minutes >= 0 and cooldown_minutes <= 10080),
  quiet_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references internal_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_rule_logs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references notification_rules(id) on delete set null,
  entity_type text check (entity_type in ('order', 'intervention', 'system')),
  entity_id uuid,
  matched boolean not null default false,
  notification_id uuid references app_notifications(id) on delete set null,
  reason text,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references internal_users(id) on delete cascade,
  receive_internal boolean not null default true,
  receive_push boolean not null default true,
  mute_info boolean not null default false,
  keep_critical_enabled boolean not null default true,
  mute_until timestamptz,
  quiet_hours jsonb not null default '{"enabled":false,"from":"18:00","to":"08:00"}'::jsonb,
  muted_rule_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references app_notifications(id) on delete cascade,
  user_id uuid references internal_users(id) on delete cascade,
  rule_id uuid references notification_rules(id) on delete set null,
  channel text not null check (channel in ('internal', 'pwa', 'email_future', 'whatsapp_future', 'webhook_future')),
  status text not null check (status in ('sent', 'failed', 'skipped', 'muted', 'cooldown')),
  sent_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'app_notifications_rule_id_fkey') then
    alter table app_notifications
      add constraint app_notifications_rule_id_fkey foreign key (rule_id) references notification_rules(id) on delete set null;
  end if;
end $$;

create unique index if not exists idx_notification_rules_unique_event_name on notification_rules(event_type, name);
create index if not exists idx_notification_rules_active_event on notification_rules(is_active, event_type, entity_type);
create index if not exists idx_notification_rules_severity on notification_rules(severity, is_active);
create index if not exists idx_notification_rule_logs_rule_created on notification_rule_logs(rule_id, created_at desc);
create index if not exists idx_notification_rule_logs_entity on notification_rule_logs(entity_type, entity_id, created_at desc);
create index if not exists idx_notification_rule_logs_matched on notification_rule_logs(matched, created_at desc);
create index if not exists idx_notification_preferences_user on notification_preferences(user_id);
create index if not exists idx_notification_deliveries_user_created on notification_deliveries(user_id, created_at desc);
create index if not exists idx_notification_deliveries_notification on notification_deliveries(notification_id, channel, created_at desc);
create index if not exists idx_notification_deliveries_rule_status on notification_deliveries(rule_id, status, created_at desc);
create index if not exists idx_app_notifications_rule_created on app_notifications(rule_id, created_at desc);
create index if not exists idx_app_notifications_severity_created on app_notifications(severity, created_at desc);
create index if not exists idx_app_notifications_entity_created on app_notifications(entity_type, entity_id, created_at desc);
create index if not exists idx_app_notifications_group_created on app_notifications(group_key, created_at desc);
create index if not exists idx_app_notifications_action on app_notifications(action_url) where action_url is not null;

create or replace trigger trg_notification_rules_updated_at
before update on notification_rules
for each row
execute function set_updated_at();

create or replace trigger trg_notification_preferences_updated_at
before update on notification_preferences
for each row
execute function set_updated_at();

-- Regras iniciais: podem ser editadas/desativadas pela tela administrativa.
insert into notification_rules (name, description, event_type, entity_type, conditions, severity, recipient_strategy, channels, template, action_label, action_url_template, cooldown_minutes, is_active)
values
  ('O.S. criada sem responsável', 'Alerta quando uma O.S. operacional ainda não tem responsável interno nem técnico.', 'order_unassigned', 'order', '{"statuses":["ABERTA","ENCAMINHADA","EM_ACOMPANHAMENTO","PENDENTE"]}', 'attention', '["admins"]', '["internal","pwa"]', 'A O.S. {{order_number}} está sem responsável. Cliente/local: {{client_name}}.', 'Ver O.S.', '/orders?selected={{entity_id}}', 60, true),
  ('O.S. vencendo em 2 horas', 'Alerta antes do prazo expirar.', 'order_due_soon', 'order', '{"hours_before":2}', 'important', '["responsible","admins"]', '["internal","pwa"]', 'A O.S. {{order_number}} vence em até {{hours_before}}h. Cliente/local: {{client_name}}.', 'Abrir O.S.', '/orders?selected={{entity_id}}', 60, true),
  ('O.S. atrasada', 'Alerta quando o prazo da O.S. já passou.', 'order_late', 'order', '{"late":true}', 'critical', '["responsible","admins"]', '["internal","pwa"]', 'A O.S. {{order_number}} está atrasada. Prazo: {{deadline}}.', 'Abrir fila', '/orders?status=all&due=late', 90, true),
  ('O.S. sem atualização há 24h', 'Alerta para ordens abertas que não recebem atualização há muito tempo.', 'order_stale', 'order', '{"hours_without_update":24}', 'attention', '["responsible","admins"]', '["internal"]', 'A O.S. {{order_number}} está sem atualização há mais de 24h.', 'Ver O.S.', '/orders?selected={{entity_id}}', 240, true),
  ('Intervenção hoje', 'Alerta para intervenções programadas para hoje.', 'intervention_today', 'intervention', '{"day":"today"}', 'important', '["responsible","admins"]', '["internal","pwa"]', 'Intervenção hoje: {{title}} em {{location_name}}.', 'Abrir intervenção', '/intervencoes?selected={{entity_id}}', 480, true),
  ('Intervenção amanhã', 'Alerta para intervenções do dia seguinte.', 'intervention_tomorrow', 'intervention', '{"day":"tomorrow"}', 'attention', '["responsible","admins"]', '["internal"]', 'Intervenção amanhã: {{title}} em {{location_name}}.', 'Ver agenda', '/intervencoes?quick=tomorrow', 720, true),
  ('Lembrete de intervenção pendente', 'Alerta quando existem lembretes pendentes de intervenção.', 'intervention_reminder_pending', 'intervention', '{"status":"pending"}', 'attention', '["admins"]', '["internal"]', 'Existem lembretes pendentes de intervenção para revisar.', 'Abrir intervenções', '/intervencoes', 240, true),
  ('Falha de cron ou rotina', 'Alerta administrativo para falhas de rotina/sistema.', 'system_cron_failed', 'system', '{"source":"cron"}', 'critical', '["admins"]', '["internal"]', 'Uma rotina do InfraOS falhou: {{reason}}.', 'Abrir saúde', '/settings', 60, true)
on conflict do nothing;

comment on table notification_rules is 'Regras configuráveis do Motor de Notificações Inteligentes do InfraOS.';
comment on table notification_rule_logs is 'Histórico de execução/match das regras de notificação.';
comment on table notification_preferences is 'Preferências individuais de notificação por usuário.';
comment on table notification_deliveries is 'Controle de entrega por usuário/canal para o novo motor de notificações.';
