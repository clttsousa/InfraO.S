import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, Inbox, LoaderCircle, Sparkles, TriangleAlert } from "lucide-react";
import { cn } from "@/components/shared/utils";

export function Surface({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("app-surface rounded-[var(--radius-panel)]", className)} {...props}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions, className = "" }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; className?: string; }) {
  return (
    <div className={cn("animate-slideInUp flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
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

export function getButtonClasses(variant: ButtonVariant, size: ButtonSize) {
  const variants = { default: "btn-primary", secondary: "btn-secondary", danger: "btn-danger", ghost: "btn-ghost" };
  const sizes = { sm: "btn-sm", md: "btn-md" };
  return cn("btn-base disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]", variants[variant], sizes[size]);
}

export function Button({ children, className = "", variant = "default", size = "md", type = "button", disabled, loading = false, ...props }: { children: ReactNode; className?: string; variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} disabled={disabled || loading} className={cn(getButtonClasses(variant, size), className)} {...props}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{children}</button>;
}

export function ButtonLink({ href, children, className = "", variant = "secondary", size = "md", scroll = true }: { href: string; children: ReactNode; className?: string; variant?: ButtonVariant; size?: ButtonSize; scroll?: boolean; }) {
  return <Link href={href} scroll={scroll} className={cn(getButtonClasses(variant, size), className)}>{children}</Link>;
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={cn("badge-base", className)}>{children}</span>;
}

export function FormSection({ title, description, children, compact = false, icon }: { title: string; description?: string; children: ReactNode; compact?: boolean; icon?: ReactNode }) {
  return <section className={cn("form-section-card", compact ? "p-4" : "p-5")}><div className="form-section-header"><div className="flex items-start gap-3">{icon ? <div className="form-section-icon">{icon}</div> : null}<div><h3 className="app-title text-base font-semibold">{title}</h3>{description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}</div></div></div><div className="mt-4">{children}</div></section>;
}

export function FormHelper({ children, id }: { children: ReactNode; id?: string }) { return <p id={id} className="field-hint">{children}</p>; }
export function FormHint({ children }: { children: ReactNode }) { return <div className="form-hint-box"><Sparkles className="h-4 w-4 text-[var(--primary)]" /><span>{children}</span></div>; }

export function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="app-text-secondary mb-1.5 text-sm font-medium">{label}</p><div className="input-base app-text rounded-[var(--radius-control)] px-3 py-2.5 text-sm shadow-none">{value}</div></div>;
}

type BaseFieldProps = { label: string; name: string; id?: string; description?: string; error?: string; required?: boolean; };

function buildFieldIds(name: string, explicitId?: string) {
  const safeName = explicitId ?? `field-${name.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
  return {
    inputId: safeName,
    descriptionId: `${safeName}-description`,
    errorId: `${safeName}-error`
  };
}

function getAriaDescribedBy(description?: string, error?: string, ids?: { descriptionId: string; errorId: string }) {
  if (!ids) return undefined;
  const targets = [description ? ids.descriptionId : "", error ? ids.errorId : ""].filter(Boolean);
  return targets.length ? targets.join(" ") : undefined;
}

export function TextInput({ label, name, id, defaultValue = "", required = false, type = "text", placeholder = "", description, error, autoFocus = false, className = "", ...props }: BaseFieldProps & { defaultValue?: string; type?: string; placeholder?: string; autoFocus?: boolean; className?: string; } & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue" | "type" | "placeholder" | "required" | "autoFocus">) {
  const ids = buildFieldIds(name, id);
  return <label htmlFor={ids.inputId} className="field-stack block"><span className="app-text-secondary mb-1.5 block text-sm font-medium">{label}{required ? <span className="ml-1 text-[var(--danger)]">*</span> : null}</span><input id={ids.inputId} aria-invalid={error ? true : undefined} aria-describedby={getAriaDescribedBy(description, error, ids)} name={name} defaultValue={defaultValue} required={required} type={type} placeholder={placeholder} autoFocus={autoFocus} className={cn("input-base text-sm outline-none", error ? "field-invalid" : "", className)} {...props} />{description ? <span id={ids.descriptionId} className="field-hint">{description}</span> : null}{error ? <span id={ids.errorId} role="alert" className="field-error">{error}</span> : null}</label>;
}

export function SelectInput({ label, name, id, defaultValue, options, description, error, className = "", ...props }: BaseFieldProps & { defaultValue?: string; options: Array<{ label: string; value: string }>; className?: string; } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "defaultValue">) {
  const ids = buildFieldIds(name, id);
  return <label htmlFor={ids.inputId} className="field-stack block"><span className="app-text-secondary mb-1.5 block text-sm font-medium">{label}{props.required ? <span className="ml-1 text-[var(--danger)]">*</span> : null}</span><select id={ids.inputId} aria-invalid={error ? true : undefined} aria-describedby={getAriaDescribedBy(description, error, ids)} name={name} defaultValue={defaultValue} className={cn("select-base text-sm outline-none", error ? "field-invalid" : "", className)} {...props}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{description ? <span id={ids.descriptionId} className="field-hint">{description}</span> : null}{error ? <span id={ids.errorId} role="alert" className="field-error">{error}</span> : null}</label>;
}

export function TextAreaInput({ label, name, id, defaultValue = "", rows = 4, description, error, className = "", ...props }: BaseFieldProps & { defaultValue?: string; rows?: number; className?: string; } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "defaultValue" | "rows">) {
  const ids = buildFieldIds(name, id);
  return <label htmlFor={ids.inputId} className="field-stack block"><span className="app-text-secondary mb-1.5 block text-sm font-medium">{label}{props.required ? <span className="ml-1 text-[var(--danger)]">*</span> : null}</span><textarea id={ids.inputId} aria-invalid={error ? true : undefined} aria-describedby={getAriaDescribedBy(description, error, ids)} name={name} defaultValue={defaultValue} rows={rows} className={cn("textarea-base text-sm outline-none", error ? "field-invalid" : "", className)} {...props} />{description ? <span id={ids.descriptionId} className="field-hint">{description}</span> : null}{error ? <span id={ids.errorId} role="alert" className="field-error">{error}</span> : null}</label>;
}

export function StatLine({ label, value, valueClassName = "app-text" }: { label: string; value: string; valueClassName?: string }) {
  return <div className="app-divider flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0"><span className="app-text-secondary text-sm">{label}</span><span className={cn("text-right text-sm font-semibold", valueClassName)}>{value}</span></div>;
}

export function EmptyState({ title, description, action, compact = false }: { title: string; description: string; action?: ReactNode; compact?: boolean; }) {
  return <div className={cn("empty-state-box animate-scaleIn flex flex-col items-center justify-center px-6 text-center", compact ? "py-9" : "py-14")}><div className="empty-state-icon app-surface-muted app-text-secondary rounded-2xl p-3"><Inbox className="h-5 w-5" /></div><h3 className="app-title mt-4 text-base font-semibold">{title}</h3><p className="app-text-secondary mt-2 max-w-md text-sm leading-6">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function FeedbackMessage({ type, children, title }: { type: "success" | "error" | "warning" | "info"; children: ReactNode; title?: string }) {
  const tone = {
    success: { icon: <CheckCircle2 className="h-4 w-4 shrink-0" />, wrapper: "toast-success", badge: "badge-success", heading: title ?? "Ação concluída" },
    error: { icon: <AlertCircle className="h-4 w-4 shrink-0" />, wrapper: "toast-error", badge: "badge-danger", heading: title ?? "Não foi possível concluir" },
    warning: { icon: <TriangleAlert className="h-4 w-4 shrink-0" />, wrapper: "toast-warning", badge: "badge-warning", heading: title ?? "Atenção" },
    info: { icon: <Info className="h-4 w-4 shrink-0" />, wrapper: "toast-info", badge: "badge-primary", heading: title ?? "Informação" }
  }[type];
  return <div role="status" className={cn("mt-4 flex items-start gap-3 px-4 py-3 text-sm", tone.wrapper)}><div className={cn("mt-0.5 rounded-full p-1", tone.badge)}>{tone.icon}</div><div className="min-w-0"><div className="text-sm font-semibold text-[var(--text-primary)]">{tone.heading}</div><div className="mt-0.5 leading-6 text-[var(--text-secondary)]">{children}</div></div></div>;
}

export function LoadingCard({ lines = 4 }: { lines?: number }) {
  return <div className="app-surface rounded-[var(--radius-panel)] p-5"><div className="skeleton-line skeleton-line-strong h-4 w-32 rounded-full" /><div className="mt-4 space-y-3">{Array.from({ length: lines }).map((_, index) => <div key={index} className="skeleton-line h-3 rounded-full" />)}</div></div>;
}
