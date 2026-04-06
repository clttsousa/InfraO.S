import { query } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { isUuid } from "@/lib/validation";
import type { SavedOrderView } from "@/types";

function isMissingSavedViewsTableError(error: unknown) {
  return error instanceof Error && /saved_order_views|does not exist|relation .* does not exist/i.test(error.message);
}

export async function getSavedOrderViews(internalUserId: string): Promise<SavedOrderView[]> {
  if (!isUuid(internalUserId)) return [];

  try {
    const result = await query<{ id: string; name: string; query_string: string; created_at: string; updated_at: string }>(
      `
        select id, name, query_string, created_at, updated_at
        from saved_order_views
        where internal_user_id = $1
        order by updated_at desc, name asc
      `,
      [internalUserId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      queryString: row.query_string,
      createdAt: formatDateTime(row.created_at),
      updatedAt: formatDateTime(row.updated_at)
    }));
  } catch (error) {
    if (isMissingSavedViewsTableError(error)) return [];
    throw error;
  }
}

export function isSavedOrderViewsTableMissing(error: unknown) {
  return isMissingSavedViewsTableError(error);
}
