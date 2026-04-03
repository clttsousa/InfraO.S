-- InfraOS v3.1 - limpeza de dados de demonstração
-- Atenção: este script remove O.S., técnicos e usuários de desenvolvimento.

begin;

create extension if not exists pgcrypto;

insert into internal_users (full_name, email, password_hash, role, is_active)
values ('Cleiton', 'cleiton@infraos.local', crypt('123456', gen_salt('bf')), 'ADMIN', true)
on conflict (email) do update
set full_name = excluded.full_name,
    password_hash = excluded.password_hash,
    role = 'ADMIN',
    is_active = true,
    updated_at = now();

delete from service_orders;
delete from technicians;
delete from internal_users where lower(email) <> 'cleiton@infraos.local';

update internal_users
set full_name = 'Cleiton',
    role = 'ADMIN',
    is_active = true,
    updated_at = now()
where lower(email) = 'cleiton@infraos.local';

commit;
