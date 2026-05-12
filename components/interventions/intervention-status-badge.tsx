import { Badge } from "@/components/shared/ui";
import { getInterventionStatusBadgeClass } from "@/lib/interventions";
import type { InterventionStatusDb } from "@/types";

export function InterventionStatusBadge({ status, label, isLate = false }: { status: InterventionStatusDb; label?: string; isLate?: boolean }) {
  return <Badge className={getInterventionStatusBadgeClass(status, isLate)}>{label ?? status}</Badge>;
}
