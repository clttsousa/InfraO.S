"use client";

import { useRef } from "react";
import { useConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/shared/ui";

export function UserToggleForm({ userId, isActive, action }: { userId: string; isActive: boolean; action: (formData: FormData) => void | Promise<void> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { confirm, Dialog } = useConfirmDialog();

  const handleClick = async () => {
    const confirmed = await confirm({
      type: isActive ? "warning" : "info",
      title: isActive ? "Inativar usuário?" : "Ativar usuário?",
      description: isActive ? "O usuário perderá acesso ao sistema até ser reativado." : "O usuário voltará a ter acesso ao sistema.",
      confirmText: isActive ? "Inativar" : "Ativar",
      cancelText: "Cancelar"
    });

    if (confirmed) {
      formRef.current?.requestSubmit();
    }
  };

  return (
    <>
      <form ref={formRef} action={action}>
        <input type="hidden" name="id" value={userId} />
        <input type="hidden" name="nextActive" value={isActive ? "false" : "true"} />
        <Button type="button" variant="secondary" size="sm" onClick={() => void handleClick()}>
          {isActive ? "Inativar" : "Ativar"}
        </Button>
      </form>
      {Dialog}
    </>
  );
}
