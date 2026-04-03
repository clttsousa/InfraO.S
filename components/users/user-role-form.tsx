"use client";

import { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/shared/ui";

export function UserRoleForm({ userId, userName, currentRole, action }: { userId: string; userName: string; currentRole: "ADMIN" | "OPERADOR"; action: (formData: FormData) => void | Promise<void>; }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [nextRole, setNextRole] = useState(currentRole);
  const { confirm, Dialog } = useConfirmDialog();
  const hasChanges = nextRole !== currentRole;

  const handleSubmit = async () => {
    if (!hasChanges) return;

    const confirmed = await confirm({
      type: nextRole === "ADMIN" ? "info" : "warning",
      title: "Alterar perfil do usuário?",
      description: nextRole === "ADMIN" ? `${userName} passará a ter acesso administrativo completo.` : `${userName} deixará de ter acesso administrativo e continuará apenas com a operação.`,
      confirmText: "Salvar perfil",
      cancelText: "Cancelar"
    });

    if (confirmed) {
      formRef.current?.requestSubmit();
    }
  };

  return (
    <>
      <form ref={formRef} action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={userId} />
        <input type="hidden" name="fullName" value={userName} />
        <input type="hidden" name="role" value={nextRole} />
        <select value={nextRole} onChange={(event) => setNextRole(event.target.value as "ADMIN" | "OPERADOR")} className="select-base min-w-[148px] text-sm outline-none" aria-label={`Perfil de ${userName}`}>
          <option value="ADMIN">Administrador</option>
          <option value="OPERADOR">Operador</option>
        </select>
        <Button type="button" variant={hasChanges ? "default" : "secondary"} size="sm" disabled={!hasChanges} onClick={() => void handleSubmit()}>
          <ShieldCheck className="h-4 w-4" />Salvar perfil
        </Button>
      </form>
      {Dialog}
    </>
  );
}
