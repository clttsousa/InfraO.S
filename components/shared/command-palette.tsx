"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Command, X } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
  action?: () => void;
  href?: string;
  shortcut?: string;
}

export function CommandPalette({ commands, isOpen: controlledIsOpen, onOpenChange }: { commands: CommandItem[]; isOpen?: boolean; onOpenChange?: (isOpen: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(controlledIsOpen ?? false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const open = controlledIsOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const filtered = useMemo(
    () =>
      commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category?.toLowerCase().includes(query.toLowerCase())
      ),
    [commands, query]
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = useCallback(
    (cmd: CommandItem) => {
      if (cmd.action) {
        cmd.action();
      } else if (cmd.href) {
        router.push(cmd.href);
      }
      setOpen(false);
      setQuery("");
      setSelectedIndex(0);
    },
    [router, setOpen]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!filtered.length) {
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((index) => (index + 1) % filtered.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((index) => (index - 1 + filtered.length) % filtered.length);
          break;
        case "Enter":
          e.preventDefault();
          handleSelect(filtered[selectedIndex] ?? filtered[0]);
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [filtered, selectedIndex, handleSelect, setOpen]
  );

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-[14vh] z-50 w-[min(92vw,44rem)] -translate-x-1/2">
        <div className="app-panel overflow-hidden border">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-[var(--text-tertiary)]" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar páginas, ações e atalhos..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="w-full border-0 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
            <button type="button" onClick={() => setOpen(false)} className="btn-base btn-ghost btn-sm h-8 w-8 rounded-lg p-0" aria-label="Fechar paleta de comandos">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="app-scrollbar max-h-[24rem] overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">Nenhum comando encontrado.</div>
            ) : (
              filtered.map((cmd, index) => {
                const active = index === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => handleSelect(cmd)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{ background: active ? "var(--primary-soft)" : "transparent" }}
                  >
                    {cmd.icon ? <span className="shrink-0 text-[var(--primary)]">{cmd.icon}</span> : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{cmd.label}</p>
                      {cmd.description ? <p className="text-xs text-[var(--text-secondary)]">{cmd.description}</p> : null}
                    </div>
                    {cmd.shortcut ? <span className="app-number text-xs text-[var(--text-tertiary)]">{cmd.shortcut}</span> : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--text-tertiary)]">
            <div className="flex flex-wrap items-center gap-3">
              <span>↑↓ navegar</span>
              <span>↵ abrir</span>
              <span>Esc fechar</span>
            </div>
            <span className="inline-flex items-center gap-1"><Command className="h-3.5 w-3.5" />K</span>
          </div>
        </div>
      </div>
    </>
  );
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
