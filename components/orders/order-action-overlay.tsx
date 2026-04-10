"use client";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OrderActionOverlay({
  children,
  closeHref = "/orders",
  isOpen,
  onClose,
}: {
  children: ReactNode;
  closeHref?: string;
  isOpen: boolean;
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeHref, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[72] overflow-y-auto p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Fechar ação"
        className="absolute inset-0 bg-black/45"
        onClick={handleClose}
      />
      <div className="relative flex min-h-full items-start justify-center py-2 md:py-8">{children}</div>
    </div>
  );
}
