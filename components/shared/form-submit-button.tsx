"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/components/shared/utils";
import { getButtonClasses } from "@/components/shared/ui";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "default" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
};

export function SubmitButton({ children, pendingLabel, className = "", variant = "default", size = "md", disabled = false }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(getButtonClasses(variant, size), "disabled:cursor-not-allowed disabled:opacity-70", pending ? "is-pending" : "", className)}
      aria-busy={pending}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel ?? children : children}
    </button>
  );
}
