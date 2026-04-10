"use client";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function OrderDetailDrawer({
  children,
  closeHref = "/orders",
  isOpen,
  isActionOpen = false,
  onClose,
}: {
  children: ReactNode;
  closeHref?: string;
  isOpen: boolean;
  isActionOpen?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    router.push(closeHref, { scroll: false });
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isActionOpen) {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeHref, isActionOpen, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Fechar detalhes"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="absolute inset-0 flex items-end justify-end md:items-stretch md:p-4">
        <section
          aria-label="Detalhes da ordem de serviço"
          className="order-detail-drawer relative flex h-full w-full flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-lg)] md:h-auto md:max-h-[calc(100vh-2rem)] md:max-w-[min(50rem,calc(100vw-2rem))] md:rounded-[var(--radius-modal)] animate-slideInRight"
        >
          <button
            type="button"
            aria-label="Fechar detalhes"
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--surface)]/92 text-[var(--text-secondary)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:text-[var(--text-primary)]"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] flex justify-center pt-2 md:hidden">
            <span className="h-1.5 w-14 rounded-full bg-[color:var(--border-strong)]/85" />
          </div>
          <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto pt-2 md:pt-0">{children}</div>
        </section>
      </div>
    </div>
  );
}
