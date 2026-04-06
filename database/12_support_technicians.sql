create table if not exists service_order_technicians (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  technician_id uuid not null references technicians(id),
  role text not null default 'SUPPORT' check (role in ('SUPPORT')),
  created_at timestamptz not null default now(),
  constraint service_order_technicians_unique unique (service_order_id, technician_id)
);

create index if not exists idx_service_order_technicians_order_id on service_order_technicians(service_order_id);
create index if not exists idx_service_order_technicians_technician_id on service_order_technicians(technician_id);
