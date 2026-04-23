export default function BrowseLoading() {
  return (
    <main className="min-h-screen bg-[#050508]">
      {/* Navbar skeleton */}
      <div className="fixed top-0 w-full z-50 h-16 glass border-b border-indigo-500/10 flex items-center justify-between px-6 md:px-12">
        <div className="h-7 w-32 bg-white/8 rounded-xl animate-pulse" />
        <div className="hidden md:flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-20 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-8 w-8 bg-white/8 rounded-lg animate-pulse" />
      </div>

      {/* Hero skeleton */}
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

      {/* Row skeletons */}
      <div className="pb-20 space-y-10 mt-4 px-6 md:px-12">
        {[1, 2, 3].map((row) => (
          <div key={row}>
            <div className="h-5 w-40 bg-white/8 rounded animate-pulse mb-4" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shrink-0 w-52 rounded-2xl bg-white/4 animate-pulse border border-white/5">
                  <div className="aspect-video bg-white/5 rounded-t-2xl" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-white/8 rounded w-4/5" />
                    <div className="h-3 bg-white/5 rounded w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
