import type { PoolClient } from "pg";
import type { AuditActionType, AuditEntityType, AuditFieldName, AuditScope } from "@/types";

type AuditValue = string | number | boolean | null | Record<string, unknown> | Array<unknown>;

type BaseAuditEventInput = {
  actorUserId?: string | null;
  actorName?: string | null;
  entityType: AuditEntityType;
  entityId?: string | null;
  scope: AuditScope;
  actionType: AuditActionType | string;
  fieldName?: AuditFieldName | string | null;
  oldValue?: AuditValue | null;
  newValue?: AuditValue | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
};

type OrderAuditEventInput = Omit<BaseAuditEventInput, "entityType" | "scope" | "entityId"> & {
  serviceOrderId: string;
};

function toJsonValue(value: unknown) {
  return value === undefined ? null : JSON.stringify(value ?? null);
}

function isMissingAuditTableError(error: unknown) {
  return error instanceof Error && /audit_events|does not exist|relation .* does not exist/i.test(error.message);
}

function normalizeAuditError(error: unknown) {
  if (isMissingAuditTableError(error)) {
    return new Error("Aplique a migration database/14_audit_events.sql para habilitar a auditoria forte.");
  }
  return error instanceof Error ? error : new Error("Não foi possível registrar a auditoria.");
}

export async function writeAuditEvent(client: PoolClient, input: BaseAuditEventInput) {
  try {
    await client.query(
      `
        insert into audit_events (
          entity_type,
          entity_id,
          scope,
          action_type,
          field_name,
          old_value,
          new_value,
          note,
          metadata,
          actor_user_id,
          actor_name
        )
        values (
          $1,
          $2::uuid,
          $3,
          $4,
          nullif($5, ''),
          $6::jsonb,
          $7::jsonb,
          nullif($8, ''),
          $9::jsonb,
          $10::uuid,
          nullif($11, '')
        )
      `,
      [
        input.entityType,
        input.entityId ?? null,
        input.scope,
        input.actionType,
        input.fieldName ?? null,
        toJsonValue(input.oldValue),
        toJsonValue(input.newValue),
        input.note ?? null,
        toJsonValue(input.metadata),
        input.actorUserId ?? null,
        input.actorName ?? null
      ]
    );
  } catch (error) {
    throw normalizeAuditError(error);
  }
}

export async function writeOrderAuditEvent(client: PoolClient, input: OrderAuditEventInput) {
  return writeAuditEvent(client, {
    ...input,
    entityType: "service_order",
    entityId: input.serviceOrderId,
    scope: "order"
  });
}
