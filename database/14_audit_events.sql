create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  scope text not null,
  action_type text not null,
  field_name text,
  old_value jsonb,
  new_value jsonb,
  note text,
  metadata jsonb,
  actor_user_id uuid references internal_users(id) on delete set null,
  actor_name text,
  created_at timestamptz not null default now(),
  constraint audit_events_entity_type_check check (entity_type in ('service_order', 'internal_user', 'technician', 'system')),
  constraint audit_events_scope_check check (scope in ('order', 'user', 'technician', 'system'))
);

create index if not exists idx_audit_events_entity on audit_events(entity_type, entity_id, created_at desc);
create index if not exists idx_audit_events_actor on audit_events(actor_user_id, created_at desc);
create index if not exists idx_audit_events_scope_action on audit_events(scope, action_type, created_at desc);
create index if not exists idx_audit_events_created_at on audit_events(created_at desc);
