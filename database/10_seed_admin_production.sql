-- InfraOS v3.1 - seed mínimo recomendado para produção
-- Edite nome, e-mail e senha antes de aplicar.
insert into internal_users (full_name, email, password_hash, role, is_active)
values (
  'Administrador InfraOS',
  'admin@empresa.local',
  crypt('troque-esta-senha-imediatamente', gen_salt('bf')),
  'ADMIN',
  true
)
on conflict (email) do update
set full_name = excluded.full_name,
    password_hash = excluded.password_hash,
    role = 'ADMIN',
    is_active = true,
    updated_at = now();
