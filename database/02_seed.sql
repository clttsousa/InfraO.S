-- InfraOS v3.1 - seed de desenvolvimento local
-- Não use este arquivo como seed final de produção.
insert into internal_users (full_name, email, password_hash, role, is_active)
values
  ('Cleiton', 'cleiton@infraos.local', crypt('123456', gen_salt('bf')), 'ADMIN', true)
on conflict (email) do update
set full_name = excluded.full_name,
    password_hash = excluded.password_hash,
    role = 'ADMIN',
    is_active = true,
    updated_at = now();
