"use client";

import { useEffect } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
}

/**
 * Hook para registrar atalhos de teclado globais
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = (e.ctrlKey || e.metaKey) === (shortcut.ctrl ?? false);
        const shiftMatches = e.shiftKey === (shortcut.shift ?? false);
        const altMatches = e.altKey === (shortcut.alt ?? false);

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          e.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

/**
 * Componente para exibir ajuda de atalhos
 */
export function KeyboardShortcutsHelp({
  shortcuts,
  isOpen,
  onClose,
}: {
  shortcuts: Array<{ keys: string; description: string }>;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-xl shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Atalhos de Teclado</h2>
          </div>
          <div className="p-6 space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <p className="text-sm text-foreground">{shortcut.description}</p>
                <kbd className="px-2 py-1 bg-muted rounded border border-border text-xs font-mono">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
