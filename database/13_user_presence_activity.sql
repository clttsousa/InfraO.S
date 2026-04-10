alter table internal_users
  add column if not exists last_seen_at timestamptz;

create index if not exists idx_internal_users_last_seen_at on internal_users (last_seen_at desc nulls last);

update internal_users
set last_seen_at = coalesce(last_seen_at, last_login_at)
where last_seen_at is null;
