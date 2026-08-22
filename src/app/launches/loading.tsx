export default function LaunchesLoading() {
  return (
    <div>
      <div className="h-9 w-36 animate-pulse rounded-[6px] bg-[var(--bc-surface-2)]" />
      <div className="mt-3 h-4 w-[min(520px,85%)] animate-pulse rounded bg-[var(--bc-surface-2)]" />
      <div className="mt-8 h-10 border-b border-[var(--bc-line)]" />
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[72px_minmax(0,1fr)_72px] gap-4 border-b border-[var(--bc-line)] py-5">
          <div className="aspect-square animate-pulse rounded-[8px] bg-[var(--bc-surface-2)]" />
          <div>
            <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--bc-surface-2)]" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-[var(--bc-surface-2)]" />
          </div>
          <div className="h-10 animate-pulse rounded-[8px] bg-[var(--bc-surface-2)]" />
        </div>
      ))}
    </div>
  );
}
