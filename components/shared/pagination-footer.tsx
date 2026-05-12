import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ButtonLink } from "@/components/shared/ui";

type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

type PaginationFooterProps = {
  basePath: string;
  baseQuery: URLSearchParams;
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  pageSizeOptions: readonly number[];
  label?: string;
  className?: string;
};

function createHref(basePath: string, baseQuery: URLSearchParams, page: number) {
  const url = new URLSearchParams(baseQuery);
  url.delete("success");
  url.delete("error");
  if (page <= 1) url.delete("page");
  else url.set("page", String(page));
  const query = url.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function createPageSizeHref(basePath: string, baseQuery: URLSearchParams, pageSize: number, defaultPageSize: number) {
  const url = new URLSearchParams(baseQuery);
  url.delete("page");
  url.delete("success");
  url.delete("error");
  if (pageSize === defaultPageSize) url.delete("pageSize");
  else url.set("pageSize", String(pageSize));
  const query = url.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function getRange(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  if (currentPage <= 3) [2, 3, 4].forEach((item) => pages.add(item));
  if (currentPage >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((item) => pages.add(item));

  const normalized = Array.from(pages).filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);
  const range: PaginationItem[] = [];
  normalized.forEach((item, index) => {
    const previous = normalized[index - 1];
    if (previous && item - previous > 1) range.push(previous === 1 ? "ellipsis-start" : "ellipsis-end");
    range.push(item);
  });
  return range;
}

export function PaginationFooter({
  basePath,
  baseQuery,
  page,
  totalPages,
  pageSize,
  total,
  pageSizeOptions,
  label = "registro(s)",
  className = ""
}: PaginationFooterProps) {
  const normalizedTotalPages = Math.max(totalPages, 1);
  const normalizedPage = Math.min(Math.max(page, 1), normalizedTotalPages);
  const hasPrevious = normalizedPage > 1;
  const hasNext = normalizedPage < normalizedTotalPages;
  const pageStart = total > 0 ? (normalizedPage - 1) * pageSize + 1 : 0;
  const pageEnd = total > 0 ? Math.min(total, normalizedPage * pageSize) : 0;
  const defaultPageSize = pageSizeOptions[0] ?? pageSize;
  const range = getRange(normalizedPage, normalizedTotalPages);

  return (
    <div className={`mt-4 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 shadow-[var(--shadow-sm)] md:px-4 ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 text-sm text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--text-primary)]">{pageStart}-{pageEnd}</span> de <span className="font-medium text-[var(--text-primary)]">{total}</span> {label}
          <span className="ml-2 text-xs text-[var(--text-tertiary)]">Página {normalizedPage} de {normalizedTotalPages}</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="inline-flex w-fit items-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] p-1">
            {pageSizeOptions.map((option) => (
              <Link
                key={option}
                href={createPageSizeHref(basePath, baseQuery, option, defaultPageSize)}
                className={`pagination-size-link ${pageSize === option ? "pagination-size-link-active" : ""}`}
                aria-current={pageSize === option ? "page" : undefined}
              >
                {option}
              </Link>
            ))}
            <span className="px-2 text-xs text-[var(--text-tertiary)]">por página</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <ButtonLink href={createHref(basePath, baseQuery, normalizedPage - 1)} variant="secondary" size="sm" className={hasPrevious ? "" : "pointer-events-none opacity-50"}>
              <ChevronLeft className="h-4 w-4" />Anterior
            </ButtonLink>

            <div className="hidden items-center gap-1 md:flex">
              {range.map((item, index) => (
                typeof item === "number" ? (
                  <Link
                    key={item}
                    href={createHref(basePath, baseQuery, item)}
                    aria-current={item === normalizedPage ? "page" : undefined}
                    className={`pagination-page-link ${item === normalizedPage ? "pagination-page-link-active" : ""}`}
                  >
                    {item}
                  </Link>
                ) : (
                  <span key={`${item}-${index}`} className="px-1.5 text-[var(--text-tertiary)]">...</span>
                )
              ))}
            </div>

            <span className="badge-base badge-neutral md:hidden">{normalizedPage}/{normalizedTotalPages}</span>
            <ButtonLink href={createHref(basePath, baseQuery, normalizedPage + 1)} variant="secondary" size="sm" className={hasNext ? "" : "pointer-events-none opacity-50"}>
              Próxima<ChevronRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
