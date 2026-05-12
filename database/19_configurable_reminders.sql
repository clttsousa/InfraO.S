-- InfraOS V6.13.0 — Lembretes Configuráveis
-- Execute após database/18_global_push_devices.sql.

alter table infra_events
  add column if not exists reminder_config jsonb not null default '{"enabledTypes":["one_day_before","same_day"],"dailyTime":"08:00","customAt":null}'::jsonb;

alter table reminders
  add column if not exists canceled_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table reminders
  drop constraint if exists reminders_reminder_type_check;

alter table reminders
  add constraint reminders_reminder_type_check
  check (reminder_type in ('one_day_before', 'same_day', 'six_hours_before', 'two_hours_before', 'thirty_minutes_before', 'custom'));

create table if not exists intervention_reminder_settings (
  id integer primary key default 1 check (id = 1),
  default_daily_time text not null default '08:00' check (default_daily_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  default_enabled_types text[] not null default array['one_day_before','same_day'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intervention_reminder_settings_types_check check (
    default_enabled_types <@ array['one_day_before','same_day','six_hours_before','two_hours_before','thirty_minutes_before']::text[]
  )
);

insert into intervention_reminder_settings (id, default_daily_time, default_enabled_types)
values (1, '08:00', array['one_day_before','same_day'])
on conflict (id) do nothing;

create index if not exists idx_reminders_event_status_time on reminders(event_id, status, remind_at);
create index if not exists idx_reminders_type_status on reminders(reminder_type, status, remind_at);

create or replace trigger trg_intervention_reminder_settings_updated_at
before update on intervention_reminder_settings
for each row
execute function set_updated_at();

comment on column infra_events.reminder_config is 'Configuração individual de lembretes da intervenção. Ex.: tipos ativos, horário diário e horário personalizado.';
comment on table intervention_reminder_settings is 'Configurações globais dos lembretes padrão aplicados a novas intervenções.';
comment on column reminders.canceled_at is 'Data/hora em que o lembrete pendente foi cancelado por edição, conclusão ou cancelamento da intervenção.';
