-- InfraOS V6.17.0 — Performance, Paginação e Busca
-- Execute após database/19_configurable_reminders.sql.
-- Objetivo: melhorar filtros, paginação server-side, busca textual e painéis com grande volume de dados.

create extension if not exists pg_trgm;

-- O.S.: filtros operacionais, filas do dashboard e ordenação por prazo/atividade.
create index if not exists idx_service_orders_status_deadline_updated
  on service_orders(status, deadline_at, updated_at desc);

create index if not exists idx_service_orders_active_deadline
  on service_orders(deadline_at, status)
  where status not in ('FINALIZADA', 'CANCELADA') and deadline_at is not null;

create index if not exists idx_service_orders_active_updated
  on service_orders(updated_at desc)
  where status not in ('FINALIZADA', 'CANCELADA');

create index if not exists idx_service_orders_technician_status_deadline
  on service_orders(technician_id, status, deadline_at)
  where technician_id is not null;

create index if not exists idx_service_orders_owner_status_updated
  on service_orders(internal_owner_id, status, updated_at desc)
  where internal_owner_id is not null;

create index if not exists idx_service_orders_order_number_trgm
  on service_orders using gin (order_number gin_trgm_ops);

create index if not exists idx_service_orders_description_trgm
  on service_orders using gin (opening_description gin_trgm_ops);

create index if not exists idx_service_orders_address_trgm
  on service_orders using gin (address_text gin_trgm_ops)
  where address_text is not null;

-- Intervenções: paginação por data/status, filtros e busca textual.
create index if not exists idx_infra_events_active_start_status
  on infra_events(start_at desc, status, type, source)
  where archived_at is null;

create index if not exists idx_infra_events_active_responsible_start
  on infra_events(responsible_user_id, start_at desc)
  where archived_at is null and responsible_user_id is not null;

create index if not exists idx_infra_events_title_trgm
  on infra_events using gin (title gin_trgm_ops);

create index if not exists idx_infra_events_location_trgm
  on infra_events using gin (location_name gin_trgm_ops);

create index if not exists idx_infra_events_original_message_trgm
  on infra_events using gin (original_message gin_trgm_ops)
  where original_message is not null;

-- Notificações e lembretes: dropdowns, central paginada e cron de lembretes.
create index if not exists idx_app_notifications_user_read_created
  on app_notifications(user_id, read_at, created_at desc);

create index if not exists idx_app_notifications_user_type_created
  on app_notifications(user_id, type, created_at desc);

create index if not exists idx_reminders_status_time_event
  on reminders(status, remind_at, event_id);

-- Auditoria: filtros por período, entidade, ação, usuário e busca textual.
create index if not exists idx_audit_events_created_entity_action
  on audit_events(created_at desc, entity_type, action_type);

create index if not exists idx_audit_events_actor_created_action
  on audit_events(actor_user_id, created_at desc, action_type)
  where actor_user_id is not null;

create index if not exists idx_audit_events_action_trgm
  on audit_events using gin (action_type gin_trgm_ops);

create index if not exists idx_audit_events_note_trgm
  on audit_events using gin (note gin_trgm_ops)
  where note is not null;

create index if not exists idx_audit_events_actor_name_trgm
  on audit_events using gin (actor_name gin_trgm_ops)
  where actor_name is not null;

-- Usuários/presença: gestão, filtros por perfil/status e ordenação por atividade.
create index if not exists idx_internal_users_role_active_seen
  on internal_users(role, is_active, last_seen_at desc nulls last);

create index if not exists idx_internal_users_full_name_trgm
  on internal_users using gin (full_name gin_trgm_ops);

create index if not exists idx_internal_users_email_trgm
  on internal_users using gin (email gin_trgm_ops);

-- Atividades recentes usadas em dashboard/notificações.
create index if not exists idx_service_order_logs_created_at_desc
  on service_order_logs(created_at desc);
