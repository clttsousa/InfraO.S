-- InfraOS v2.2 - schema principal para Neon PostgreSQL
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists internal_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'OPERADOR' check (role in ('ADMIN', 'OPERADOR')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  password_changed_at timestamptz not null default now(),
  session_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists technicians (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  opened_at timestamptz,
  opened_by text,
  opening_description text not null,
  client_code text,
  client_name text,
  address_text text,
  location_link text,
  technician_id uuid references technicians(id),
  internal_owner_id uuid references internal_users(id),
  priority text not null default 'MEDIA' check (priority in ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')),
  status text not null default 'ABERTA' check (status in ('ABERTA', 'ENCAMINHADA', 'EM_ACOMPANHAMENTO', 'PENDENTE', 'FINALIZADA', 'CANCELADA')),
  deadline_at timestamptz,
  internal_note text,
  finalized_at timestamptz,
  finalized_by_user_id uuid references internal_users(id),
  closing_note text,
  canceled_at timestamptz,
  canceled_by_user_id uuid references internal_users(id),
  cancellation_note text,
  reopened_at timestamptz,
  reopened_by_user_id uuid references internal_users(id),
  created_by_user_id uuid references internal_users(id),
  updated_by_user_id uuid references internal_users(id),
  last_status_changed_at timestamptz,
  last_status_changed_by_user_id uuid references internal_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_order_logs (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  internal_user_id uuid references internal_users(id),
  action_type text not null,
  old_value jsonb,
  new_value jsonb,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists service_order_technicians (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  technician_id uuid not null references technicians(id),
  role text not null default 'SUPPORT' check (role in ('SUPPORT')),
  created_at timestamptz not null default now(),
  constraint service_order_technicians_unique unique (service_order_id, technician_id)
);

create table if not exists service_order_notes (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  internal_user_id uuid references internal_users(id),
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_service_orders_status on service_orders(status);
create index if not exists idx_service_orders_deadline_at on service_orders(deadline_at);
create index if not exists idx_service_orders_technician_id on service_orders(technician_id);
create index if not exists idx_service_orders_internal_owner_id on service_orders(internal_owner_id);
create index if not exists idx_service_orders_opened_at on service_orders(opened_at);
create index if not exists idx_service_orders_updated_at on service_orders(updated_at);
create index if not exists idx_service_orders_order_number on service_orders(order_number);
create index if not exists idx_service_orders_client_name_lower on service_orders (lower(client_name)) where client_name is not null;
create index if not exists idx_service_orders_client_name_trgm on service_orders using gin (client_name gin_trgm_ops);
create index if not exists idx_service_orders_canceled_at on service_orders(canceled_at);
create index if not exists idx_service_orders_last_status_changed_at on service_orders(last_status_changed_at);
create index if not exists idx_service_orders_updated_at_open on service_orders(updated_at) where status not in ('FINALIZADA', 'CANCELADA');
create index if not exists idx_service_order_logs_order_id on service_order_logs(service_order_id);
create index if not exists idx_service_order_technicians_order_id on service_order_technicians(service_order_id);
create index if not exists idx_service_order_technicians_technician_id on service_order_technicians(technician_id);
create index if not exists idx_service_order_notes_order_id on service_order_notes(service_order_id);

comment on column service_orders.client_code is 'Opcional: nem toda O.S. possui cliente.';
comment on column service_orders.client_name is 'Opcional: nem toda O.S. possui cliente.';

create or replace trigger trg_internal_users_updated_at
before update on internal_users
for each row
execute function set_updated_at();

create or replace trigger trg_technicians_updated_at
before update on technicians
for each row
execute function set_updated_at();

create or replace trigger trg_service_orders_updated_at
before update on service_orders
for each row
execute function set_updated_at();
