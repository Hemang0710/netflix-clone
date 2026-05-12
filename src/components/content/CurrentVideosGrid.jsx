export default function CurrentVideosGrid({ videos }) {
  if (!videos || videos.length === 0) {
    return (
      <div className="text-center text-slate-600 dark:text-slate-400 py-8">
        No videos currently being watched
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {videos.map(video => (
        <a
          key={video.contentId}
          href={`/watch/${video.contentId}`}
          className="group block"
        >
          <div className="relative overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700 aspect-video mb-2">
            {video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {Math.round((video.timestamp / video.duration) * 100)}%
            </div>
          </div>
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
            {video.title}
          </h3>
        </a>
      ))}
    </div>
  )
}
