import { getCurrentUser} from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function CreatorDashboard() {
    const user = await getCurrentUser()
    if(!user) redirect ("/login")

    const content = await prisma.content.findMany({
        where: {creatorId: Number(user.userId)},
        orderBy: {createdAt: "desc"},
    })

    const totalViews = content.reduce((sum,c) => sum + c.views, 0)
    const aiProcessed = content.filter(c => c.transcript).length

    return(
        <main className="min-h-screen bg-zin-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3x1 font-bold">Creator Dashboard</h1>
                <Link 
                    href="/creator/upload"
                    className="bg-red-600 hover-bg-red-700 text-white font-bold px-6 py-3 rounded transition-colors">
                        + Upload Video 
                    </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    {label: "Total Videos", value:content.length},
                    {label: "Total Views",value:totalViews},
                    {label: "AI Processed", value: `${aiProcessed}/${content.length}`},
                ].map(stat =>(
                    <div key={stat.label} className="bg-zinc-900 rounded-x1 p-6 border border-zinc-800">
                        <p className="text-zinc-400 text-sm mb-1">{stat.label}</p>
                        <p className="text-3x1 font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Content List */}
            <div className="bg-zinc-900 rounded-x1 border border-zinc-800">
                <div className="p-6 border-b border-zinc-800">
                    <h2 className="text-x1 font-bold">Your Videos</h2>
                </div>

                {content.length === 0 ? (
                    <div className="p-12 tex-center text-zinc-400">
                        <p className="text-5x1 mb-4">🎬</p>
                        <p>No videos yet. Upload your first one!</p>
                    </div>
                ): (
                    <div className="divide-y divide-zinc-800">
                        {content.map(video => (
                            <div key={video.id} className="p-6 flex items-center justify-between">
                                <div className="flex item-center gap-4">
                                    {/* Thumbnail */}
                                    <div className="w-24 h-14 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                        {video.thumbnailUrl ? (
                                            <Image
                                               src={video.thumbnailUrl}
                                               alt={video.title}
                                               className="w-full h-full object-cover"
                                            />

                                        ):(
                                            <div className="w-full h-full flex items-center justify-center text-2x1">
                                            🎬
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <p className="font-semibold">{video.title}</p>
                                        <div className="flex gap-3 text-zinc-400 text-sm mt-1">
                                            <span>{video.views}</span>
                                            <span>{video.genre}</span>
                                            <span>{video.isFree ? "Free" : `$${video.price}`} </span>
                                            <span className={video.transcript ? "text-green-400": "text-zinc-500"}>
                                                {video.transcript ? "✅ AI done" : "⏳ No AI"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Link
                                        href={`/watch/${video.id}`}
                                        className="text-sm bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded transition-colors">
                                            Watch
                                        </Link>
                                </div>
                                </div>
                        ))}
                        </div>

                )}
            </div>
            </div>
        </main>
    )
}