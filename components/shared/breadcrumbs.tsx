"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export function Breadcrumbs({ items, showHome = false }: { items: BreadcrumbItem[]; showHome?: boolean }) {
  const allItems = showHome ? [{ label: "Início", href: "/dashboard", icon: <Home className="h-4 w-4" /> }, ...items] : items;

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" /> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)]">
                {item.icon}
                {item.label}
              </Link>
            ) : (
              <span className={`flex items-center gap-1.5 ${isLast ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>
                {item.icon}
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
