"use client";

import { useEffect } from "react";

export function FormStateGuard({ formId, message = "Você tem alterações não salvas nesta tela." }: { formId: string; message?: string }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    let dirty = false;
    let submitting = false;

    const markDirty = () => {
      if (!submitting) dirty = true;
    };
    const clearDirty = () => {
      dirty = false;
    };
    const handleSubmit = (event: SubmitEvent) => {
      if (submitting) {
        event.preventDefault();
        return;
      }

      submitting = true;
      clearDirty();
      window.setTimeout(() => {
        submitting = false;
      }, 9000);
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || submitting) return;
      event.preventDefault();
      event.returnValue = message;
    };

    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    form.addEventListener("submit", handleSubmit);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("submit", handleSubmit);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formId, message]);

  return null;
}
