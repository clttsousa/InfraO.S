"use client";

import React, { useState } from "react";
import { AlertTriangle, Info, Loader2, X } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  type?: "danger" | "warning" | "info";
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

type ConfirmDialogConfig = Omit<ConfirmDialogProps, "isOpen" | "onConfirm" | "onCancel">;

export function ConfirmDialog({ isOpen, type = "warning", title, description, confirmText = "Confirmar", cancelText = "Cancelar", isLoading = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const tone = {
    danger: {
      icon: <AlertTriangle className="h-6 w-6 text-[var(--danger)]" />,
      panelBg: "color-mix(in srgb, var(--danger-soft) 65%, var(--surface))",
      buttonClass: "btn-danger"
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-[var(--warning)]" />,
      panelBg: "color-mix(in srgb, var(--warning-soft) 65%, var(--surface))",
      buttonClass: "btn-secondary"
    },
    info: {
      icon: <Info className="h-6 w-6 text-[var(--primary)]" />,
      panelBg: "color-mix(in srgb, var(--primary-soft) 65%, var(--surface))",
      buttonClass: "btn-primary"
    }
  }[type];

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="app-panel w-full max-w-md overflow-hidden border">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-6 py-5">
            <div className="flex items-start gap-3">
              {tone.icon}
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
                {description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
              </div>
            </div>
            <button type="button" onClick={onCancel} className="btn-base btn-ghost btn-sm h-8 w-8 rounded-lg p-0" disabled={isProcessing || isLoading} aria-label="Fechar diálogo">
              <X className="h-4 w-4" />
            </button>
          </div>

          {type === "danger" ? (
            <div className="border-b border-[var(--border)] px-6 py-4 text-sm leading-6 text-[var(--text-secondary)]" style={{ background: tone.panelBg }}>
              Esta ação não pode ser desfeita. Revise antes de continuar.
            </div>
          ) : null}

          <div className="flex justify-end gap-3 px-6 py-5">
            <button type="button" onClick={onCancel} disabled={isProcessing || isLoading} className="btn-base btn-ghost btn-md">
              {cancelText}
            </button>
            <button type="button" onClick={handleConfirm} disabled={isProcessing || isLoading} className={`btn-base ${tone.buttonClass} btn-md`}>
              {isProcessing || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isProcessing || isLoading ? "Processando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{ isOpen: boolean; config?: ConfirmDialogConfig; resolve?: (value: boolean) => void }>({ isOpen: false });

  const confirm = (config: ConfirmDialogConfig) =>
    new Promise<boolean>((resolve) => {
      setState({ isOpen: true, config, resolve });
    });

  const handleConfirm = async () => {
    state.resolve?.(true);
    setState({ isOpen: false });
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState({ isOpen: false });
  };

  return {
    confirm,
    Dialog: <ConfirmDialog isOpen={state.isOpen} title={state.config?.title ?? "Confirmar ação"} type={state.config?.type} description={state.config?.description} confirmText={state.config?.confirmText} cancelText={state.config?.cancelText} isLoading={state.config?.isLoading} onConfirm={handleConfirm} onCancel={handleCancel} />
  };
}
