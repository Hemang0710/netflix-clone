"use client"

function formatTime(seconds) {
    const mins = Math.floor(seconds/ 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function VideoChapters({chapters, videoRef}) {
    if(!chapters?.length) return null

    function jumpToChapter(timeInSeconds){
        if(videoRef?.current) {
            videoRef.current.currentTime = timeInSeconds
            videoRef.current.play()
        }
    }

    return (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                📑 Chapters
             <span className="text-zinc-500 text-xs font-normal">
                Click to jump
             </span>
            </h3>

            <div className="space-y-1">
                {chapters.map((chapter, index) => (
                    <button
                        key={index}
                        onClick={() => jumpToChapter(chapter.time)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
                        >
                            <span className="text-red-500 text-xs font-mono w-10 shrink-0">
                                {formatTime(chapter.time)}
                            </span>
                            <span className="text-zinc-300 text-sm group-hover:text-white transition-colors">
                                {chapter.title}
                            </span>
                            <span className="ml-auto text-zinc-600 group-hover:text-zinc-400 text-xs opacity-0 group-hover:opacity-100 transition-all">
                                ▶ Jump
                            </span>
                        </button>
                ))}
            </div>
        </div>
    )
}