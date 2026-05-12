"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/shared/ui";

export function InterventionDetailDrawer({ children, isOpen, isActionOpen = false, onClose }: { children: ReactNode; isOpen: boolean; isActionOpen?: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isActionOpen) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActionOpen, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[68] overflow-hidden">
      <button type="button" aria-label="Fechar detalhes da intervenção" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => !isActionOpen && onClose()} />
      <aside className="app-panel absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden rounded-none border-l border-[var(--border)] shadow-[var(--shadow-lg)] sm:max-w-[760px] lg:max-w-[860px]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-4">
          <div>
            <p className="app-eyebrow text-xs font-medium">Detalhe operacional</p>
            <h2 className="app-title text-lg font-semibold">Intervenção programada</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" className="px-2.5 py-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
