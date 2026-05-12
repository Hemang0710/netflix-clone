export default function SkeletonCard() {
  return (
    <div className="shrink-0 w-52 rounded-2xl bg-white/3 border border-white/5 animate-pulse overflow-hidden">
      <div className="aspect-video bg-white/5" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-white/8 rounded w-4/5" />
        <div className="h-3 bg-white/5 rounded w-3/5" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="mb-10 px-6 md:px-12">
      <div className="h-5 w-40 bg-white/8 rounded animate-pulse mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

export function SkeletoHero() {
  return (
    <div className="h-[78vh] bg-linear-to-br from-indigo-900/10 to-violet-900/10 animate-pulse flex items-end pb-20 px-6 md:px-12">
      <div className="space-y-4 max-w-lg">
        <div className="h-5 w-28 bg-white/8 rounded-full" />
        <div className="h-12 w-80 bg-white/10 rounded-xl" />
        <div className="h-4 w-56 bg-white/6 rounded" />
        <div className="h-4 w-64 bg-white/5 rounded" />
        <div className="flex gap-3 mt-6">
          <div className="h-11 w-36 bg-indigo-500/20 rounded-xl" />
          <div className="h-11 w-28 bg-white/8 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
