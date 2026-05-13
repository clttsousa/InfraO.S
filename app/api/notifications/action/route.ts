import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiSession } from "@/lib/session";
import { isUuid } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  let payload: { id?: string; action?: string } = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  if (!isUuid(payload.id)) {
    return NextResponse.json({ ok: false, message: "Notificação inválida." }, { status: 400 });
  }

  if (payload.action === "snooze") {
    const result = await query(
      `update app_notifications set snoozed_until = now() + interval '1 hour' where id = $1::uuid and user_id = $2::uuid`,
      [payload.id, session.id]
    );
    return NextResponse.json({ ok: true, updated: result.rowCount ?? 0 });
  }

  if (payload.action === "mute_rule") {
    const notification = await query<{ rule_id: string | null }>(`select rule_id::text from app_notifications where id = $1::uuid and user_id = $2::uuid limit 1`, [payload.id, session.id]);
    const ruleId = notification.rows[0]?.rule_id;
    if (!ruleId) return NextResponse.json({ ok: false, message: "Esta notificação não possui regra vinculada." }, { status: 400 });
    await query(
      `insert into notification_preferences (user_id, muted_rule_ids)
       values ($1::uuid, array[$2::uuid])
       on conflict (user_id) do update set
        muted_rule_ids = case when $2::uuid = any(notification_preferences.muted_rule_ids)
          then notification_preferences.muted_rule_ids
          else array_append(notification_preferences.muted_rule_ids, $2::uuid)
        end,
        updated_at = now()`,
      [session.id, ruleId]
    );
    return NextResponse.json({ ok: true, mutedRuleId: ruleId });
  }

  return NextResponse.json({ ok: false, message: "Ação inválida." }, { status: 400 });
}
