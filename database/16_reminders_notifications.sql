-- InfraOS V6.8 — Lembretes Internos e Notificações no Painel
-- Execute após database/15_interventions.sql.

create extension if not exists pgcrypto;

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references infra_events(id) on delete cascade,
  remind_at timestamptz not null,
  reminder_type text not null check (reminder_type in ('one_day_before', 'same_day', 'two_hours_before', 'thirty_minutes_before')),
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed', 'canceled')),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, reminder_type)
);

create table if not exists app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references internal_users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('intervention_reminder', 'intervention_today', 'intervention_late')),
  related_event_id uuid references infra_events(id) on delete cascade,
  notification_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, notification_key)
);

create index if not exists idx_reminders_due_pending on reminders(status, remind_at) where status = 'pending';
create index if not exists idx_reminders_event_id on reminders(event_id);
create index if not exists idx_reminders_type on reminders(reminder_type);
create index if not exists idx_app_notifications_user_unread on app_notifications(user_id, created_at desc) where read_at is null;
create index if not exists idx_app_notifications_event on app_notifications(related_event_id);
create index if not exists idx_app_notifications_type on app_notifications(type, created_at desc);

create or replace trigger trg_reminders_updated_at
before update on reminders
for each row
execute function set_updated_at();

comment on table reminders is 'Lembretes automáticos gerados para intervenções programadas.';
comment on table app_notifications is 'Notificações internas persistidas do painel, inicialmente usadas por lembretes de intervenções.';
comment on column app_notifications.notification_key is 'Chave idempotente usada para evitar duplicidade de notificações por usuário/evento/lembrete.';
