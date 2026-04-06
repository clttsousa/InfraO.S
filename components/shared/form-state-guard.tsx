"use client";

import { useEffect } from "react";

export function FormStateGuard({ formId, message = "Você tem alterações não salvas nesta tela." }: { formId: string; message?: string }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    let dirty = false;
    const markDirty = () => { dirty = true; };
    const clearDirty = () => { dirty = false; };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = message;
    };

    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    form.addEventListener("submit", clearDirty);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("submit", clearDirty);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formId, message]);

  return null;
}
