-- v2.8 - robustez operacional, sessão revogável e índices de busca
create extension if not exists pg_trgm;

alter table internal_users
  add column if not exists password_changed_at timestamptz not null default now(),
  add column if not exists session_version integer not null default 1;

update internal_users
set password_changed_at = coalesce(password_changed_at, now()),
    session_version = coalesce(session_version, 1);

create index if not exists idx_service_orders_client_name_lower on service_orders (lower(client_name)) where client_name is not null;
create index if not exists idx_service_orders_client_name_trgm on service_orders using gin (client_name gin_trgm_ops);
create index if not exists idx_service_orders_open_search on service_orders (status, deadline_at, updated_at);
