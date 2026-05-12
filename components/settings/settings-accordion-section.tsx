"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/components/shared/utils";

export function SettingsAccordionSection({ title, description, icon, children, defaultOpen = true }: { title: string; description?: string; icon?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const apply = () => setOpen(media.matches ? defaultOpen : true);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [defaultOpen]);

  return (
    <section className={cn("settings-accordion-card", open ? "is-open" : "")}> 
      <button type="button" className="settings-accordion-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="settings-accordion-icon">{icon}</span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-semibold text-[var(--text-primary)]">{title}</span>
          {description ? <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{description}</span> : null}
        </span>
        <ChevronDown className="settings-accordion-chevron h-4 w-4" />
      </button>
      {open ? <div className="settings-accordion-content">{children}</div> : null}
    </section>
  );
}
