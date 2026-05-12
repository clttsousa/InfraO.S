-- InfraOS V6.11 — Notificações globais por usuário e dispositivo
-- Execute após database/17_pwa_push_notifications.sql.

alter table notification_delivery_logs
  add column if not exists subscription_id uuid references push_subscriptions(id) on delete set null;

create index if not exists idx_delivery_logs_subscription on notification_delivery_logs(subscription_id, created_at desc);

comment on column notification_delivery_logs.subscription_id is 'Dispositivo/subscription PWA específico usado na tentativa de entrega. Permite diagnosticar envio por usuário e dispositivo.';
