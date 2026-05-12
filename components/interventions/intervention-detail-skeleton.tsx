export function InterventionDetailSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <div className="app-surface rounded-[var(--radius-panel)] p-5">
        <div className="skeleton-line h-4 w-40 rounded-full" />
        <div className="mt-4 skeleton-line h-8 w-3/4 rounded-full" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="skeleton-line h-16 rounded-[var(--radius-control)]" />
          <div className="skeleton-line h-16 rounded-[var(--radius-control)]" />
        </div>
      </div>
      <div className="app-surface rounded-[var(--radius-panel)] p-5">
        <div className="skeleton-line h-4 w-36 rounded-full" />
        <div className="mt-4 space-y-3">
          <div className="skeleton-line h-4 rounded-full" />
          <div className="skeleton-line h-4 w-5/6 rounded-full" />
          <div className="skeleton-line h-4 w-2/3 rounded-full" />
        </div>
      </div>
    </div>
  );
}
