export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="flex gap-2">
        <div className="h-6 bg-slate-200 rounded-full w-16" />
        <div className="h-6 bg-slate-200 rounded-full w-20" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-xl" />
      ))}
    </div>
  )
}
