export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-fadeIn">
      <div>
        <div className="skeleton-line skeleton-line-strong h-3 w-28 rounded-full" />
        <div className="mt-3 skeleton-line skeleton-line-strong h-8 w-56 rounded-full" />
        <div className="mt-3 skeleton-line h-4 w-72 rounded-full" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="skeleton-line h-8 w-24 rounded-full" />
        <div className="skeleton-line h-8 w-24 rounded-full" />
        <div className="skeleton-line h-8 w-32 rounded-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="app-surface rounded-[var(--radius-panel)] p-5">
          <div className="skeleton-line skeleton-line-strong h-5 w-36 rounded-full" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`info-${index}`} className="skeleton-line h-4 rounded-full" />
            ))}
          </div>
        </div>
        <div className="app-surface rounded-[var(--radius-panel)] p-5">
          <div className="skeleton-line skeleton-line-strong h-5 w-40 rounded-full" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`internal-${index}`} className="skeleton-line h-4 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="app-surface rounded-[var(--radius-panel)] p-5">
        <div className="skeleton-line skeleton-line-strong h-5 w-28 rounded-full" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`timeline-${index}`} className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border)] p-4">
              <div className="skeleton-line h-10 w-10 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="skeleton-line h-4 w-44 rounded-full" />
                <div className="skeleton-line h-3 rounded-full" />
                <div className="skeleton-line h-3 w-4/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
