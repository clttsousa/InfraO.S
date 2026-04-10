"use client";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OrderActionOverlay({ children, closeHref, isOpen }: { children: ReactNode; closeHref: string; isOpen: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        router.push(closeHref, { scroll: false });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeHref, isOpen, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[72] overflow-y-auto p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Fechar ação"
        className="absolute inset-0 bg-black/45"
        onClick={() => router.push(closeHref, { scroll: false })}
      />
      <div className="relative flex min-h-full items-start justify-center py-2 md:py-8">{children}</div>
    </div>
  );
}
