import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Inbox, LoaderCircle } from "lucide-react";
import { cn } from "@/components/shared/utils";

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("app-surface rounded-[var(--radius-panel)]", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = ""
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="app-eyebrow text-xs font-medium">{eyebrow}</p> : null}
        <h2 className="app-title mt-1 text-[2rem] font-semibold leading-tight md:text-[2.2rem]">{title}</h2>
        {description ? <p className="app-text-secondary mt-2 max-w-3xl text-sm leading-6">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

type ButtonVariant = "default" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

function getButtonClasses(variant: ButtonVariant, size: ButtonSize) {
  const variants = {
    default: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
    ghost: "btn-ghost"
  };
  const sizes = {
    sm: "btn-sm",
    md: "btn-md"
  };
  return cn("btn-base disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]", variants[variant], sizes[size]);
}

export function Button({
  children,
  className = "",
  variant = "default",
  size = "md",
  type = "button",
  disabled,
  loading = false,
  ...props
}: {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} disabled={disabled || loading} className={cn(getButtonClasses(variant, size), className)} {...props}>
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  className = "",
  variant = "secondary",
  size = "md"
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <Link href={href} className={cn(getButtonClasses(variant, size), className)}>{children}</Link>;
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={cn("badge-base", className)}>{children}</span>;
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="app-text-secondary mb-1.5 text-sm font-medium">{label}</p>
      <div className="input-base app-text rounded-[var(--radius-control)] px-3 py-2.5 text-sm shadow-none">{value}</div>
    </div>
  );
}

export function TextInput({ label, name, defaultValue = "", required = false, type = "text", placeholder = "" }: { label: string; name: string; defaultValue?: string; required?: boolean; type?: string; placeholder?: string; }) {
  return (
    <label className="block">
      <span className="app-text-secondary mb-1.5 block text-sm font-medium">{label}</span>
      <input name={name} defaultValue={defaultValue} required={required} type={type} placeholder={placeholder} className="input-base text-sm outline-none" />
    </label>
  );
}

export function SelectInput({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: Array<{ label: string; value: string }> }) {
  return (
    <label className="block">
      <span className="app-text-secondary mb-1.5 block text-sm font-medium">{label}</span>
      <select name={name} defaultValue={defaultValue} className="select-base text-sm outline-none">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function TextAreaInput({ label, name, defaultValue = "", rows = 4 }: { label: string; name: string; defaultValue?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="app-text-secondary mb-1.5 block text-sm font-medium">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={rows} className="textarea-base text-sm outline-none" />
    </label>
  );
}

export function StatLine({ label, value, valueClassName = "app-text" }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="app-divider flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0">
      <span className="app-text-secondary text-sm">{label}</span>
      <span className={cn("text-right text-sm font-semibold", valueClassName)}>{value}</span>
    </div>
  );
}

export function EmptyState({ title, description, action, compact = false }: { title: string; description: string; action?: ReactNode; compact?: boolean; }) {
  return (
    <div className={cn("empty-state-box flex flex-col items-center justify-center px-6 text-center", compact ? "py-9" : "py-14")}>
      <div className="app-surface-muted app-text-secondary rounded-2xl p-3"><Inbox className="h-5 w-5" /></div>
      <h3 className="app-title mt-4 text-base font-semibold">{title}</h3>
      <p className="app-text-secondary mt-2 max-w-md text-sm leading-6">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function FeedbackMessage({ type, children }: { type: "success" | "error"; children: ReactNode }) {
  const isSuccess = type === "success";
  return (
    <div role="status" className={cn("mt-4 flex items-start gap-3 px-4 py-3 text-sm", isSuccess ? "toast-success" : "toast-error")}>
      <div className={cn("mt-0.5 rounded-full p-1", isSuccess ? "badge-success" : "badge-danger")}>
        {isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      </div>
      <div className="min-w-0 leading-6">{children}</div>
    </div>
  );
}

export function LoadingCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="app-surface animate-pulse rounded-[var(--radius-panel)] p-5">
      <div className="h-4 w-32 rounded-full bg-[color:var(--border-strong)]/55" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, index) => <div key={index} className="h-3 rounded-full bg-[color:var(--border)]/70" />)}
      </div>
    </div>
  );
}
