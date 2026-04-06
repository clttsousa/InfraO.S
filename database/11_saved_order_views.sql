create table if not exists saved_order_views (
  id uuid primary key default gen_random_uuid(),
  internal_user_id uuid not null references internal_users(id) on delete cascade,
  name text not null,
  query_string text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_order_views_unique_name unique (internal_user_id, name)
);

create index if not exists idx_saved_order_views_user_id on saved_order_views(internal_user_id);

create or replace trigger trg_saved_order_views_updated_at
before update on saved_order_views
for each row
execute function set_updated_at();
