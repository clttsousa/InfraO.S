-- v2.6 - estabilização final para uso real
-- Aplicar depois das migrations anteriores.

create unique index if not exists idx_internal_users_email_lower_unique
  on internal_users (lower(email));

create or replace function normalize_internal_user_email()
returns trigger as $$
begin
  new.email = lower(trim(new.email));
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_internal_users_normalize_email
before insert or update on internal_users
for each row
execute function normalize_internal_user_email();

create or replace function validate_service_order_state()
returns trigger as $$
begin
  if new.status = 'FINALIZADA' and coalesce(btrim(new.closing_note), '') = '' then
    raise exception 'closing_note é obrigatório quando a O.S. estiver FINALIZADA';
  end if;

  if new.status = 'CANCELADA' and coalesce(btrim(new.cancellation_note), '') = '' then
    raise exception 'cancellation_note é obrigatório quando a O.S. estiver CANCELADA';
  end if;

  if new.status = 'FINALIZADA' and new.finalized_at is null then
    new.finalized_at = now();
  end if;

  if new.status = 'CANCELADA' and new.canceled_at is null then
    new.canceled_at = now();
  end if;

  return new;
end;
$$ language plpgsql;

create or replace trigger trg_service_orders_validate_state
before insert or update on service_orders
for each row
execute function validate_service_order_state();
