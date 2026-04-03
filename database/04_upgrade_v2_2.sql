-- InfraOS v2.2 - encerramento/reabertura + campos de acompanhamento operacional
alter table service_orders
  add column if not exists closing_note text,
  add column if not exists canceled_at timestamptz,
  add column if not exists canceled_by_user_id uuid references internal_users(id),
  add column if not exists cancellation_note text,
  add column if not exists reopened_at timestamptz,
  add column if not exists reopened_by_user_id uuid references internal_users(id),
  add column if not exists last_status_changed_at timestamptz,
  add column if not exists last_status_changed_by_user_id uuid references internal_users(id);

update service_orders
set last_status_changed_at = coalesce(last_status_changed_at, updated_at, created_at),
    last_status_changed_by_user_id = coalesce(last_status_changed_by_user_id, updated_by_user_id, created_by_user_id)
where last_status_changed_at is null
   or last_status_changed_by_user_id is null;

create index if not exists idx_service_orders_canceled_at on service_orders(canceled_at);
create index if not exists idx_service_orders_last_status_changed_at on service_orders(last_status_changed_at);
create index if not exists idx_service_orders_updated_at_open on service_orders(updated_at) where status not in ('FINALIZADA', 'CANCELADA');
