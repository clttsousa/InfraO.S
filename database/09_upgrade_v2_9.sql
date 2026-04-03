-- InfraOS v2.9 - proteção de login persistente no banco
create table if not exists auth_login_attempts (
  bucket_key text primary key,
  attempt_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_auth_login_attempts_updated_at on auth_login_attempts(updated_at);
