-- InfraOS V6.9 — Notificação tipo app / PWA
-- Execute após database/16_reminders_notifications.sql.

create extension if not exists pgcrypto;

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references internal_users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references app_notifications(id) on delete cascade,
  user_id uuid references internal_users(id) on delete cascade,
  channel text not null check (channel in ('internal', 'pwa', 'telegram_future', 'email_future', 'whatsapp_future')),
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_enabled on push_subscriptions(user_id, enabled, updated_at desc);
create index if not exists idx_push_subscriptions_endpoint on push_subscriptions(endpoint);
create index if not exists idx_delivery_logs_notification on notification_delivery_logs(notification_id, channel, created_at desc);
create index if not exists idx_delivery_logs_user_channel on notification_delivery_logs(user_id, channel, created_at desc);
create index if not exists idx_delivery_logs_status on notification_delivery_logs(status, created_at desc);

create or replace trigger trg_push_subscriptions_updated_at
before update on push_subscriptions
for each row
execute function set_updated_at();

comment on table push_subscriptions is 'Dispositivos autorizados a receber push notification/PWA do InfraOS.';
comment on table notification_delivery_logs is 'Histórico de entrega de notificações por canal interno, PWA e canais externos futuros.';
comment on column push_subscriptions.endpoint is 'Endpoint único da PushSubscription do navegador; não deve ser exposto publicamente.';
comment on column notification_delivery_logs.channel is 'Canal de entrega. Canais externos ficam preparados para versões futuras.';
