import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {notFound} from "next/navigation"
import AIChatSidebar from "@/components/AIChatSidebar";
import WatchPageClient  from "@/components/WatchPageClient"


export default async function WatchPage({params}) {
    const {id} = await params
    const user = await getCurrentUser()

    const content = await prisma.content.findUnique({
        where: {id: Number(id)},
        include: {
            creator: {
                select: {
                    email: true,
                    profile: {select:{name: true, avatarUrl: true}},
                },
            },
        },
    })

    if(!content) notFound()

    //Increment view count
    await prisma.content.update({
        where: {id: Number(id)},
        data: {views: {increment:1}},
    })

    const chapters = content.chapters ? JSON.parse(content.chapters) : []
    const creatorName = content.creator.profile?.name || content.creator.email

    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            <WatchPageClient
                content = {content}
                chapters = {chapters}
                creatorName = {creatorName}
            />
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Video Player */}
                <div className="w-full aspect-video bg-black rounded-x1 overflow-hidden mb-6">
                    <video 
                      src={content.videoUrl}
                      controls
                      className="w-full h-full"
                      poster={content.thumbnailUrl || undefined}
                    >
                        Your browser does not support the vidoe tag.
                    </video>
                </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left - video Info */}
                <div className="lg:col-span-2">
                    <h1 className="text-2xl font-bold mb-2">{content.title} </h1>
                    <div className="flex items-center gap-4 text-zinc-400 text-sm mb-4">
                        <span>{content.views}</span>
                        <span>{content.genre}</span>
                        <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Creator info */}
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold">
                            {creatorName[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold">{creatorName}</p>
                            <p className="text-zinc-400 text-sm">Creator</p>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-zinc-300 leading-relaxed mb-6">
                        {content.description}
                    </p>

                    {/* AI Summary*/}
                    {content.aiSummary && (
                        <div className="bg-zinc-900 rounded-xl p-6 mb-6 border border-zinc-800">
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            ✨ AI Summary
                            </h3>
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                {content.aiSummary}
                            </p>
                            </div>
                    )}

                    {/* Transcript*/}
                    {content.transcript && (
                        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            📝 Transcript
                            </h3>
                            <div className="text-zinc-400 text-sm leading-relaxed max-h-64 overflow-y-auto">
                                {content.transcript}
                            </div>
                            </div>
                    )}
                </div>

                {/* Right - Sidebar */}
                <div>
                    <h3 className="text-white font-bold mb-4">Video Details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Genre</span>
                            <span>{content.genre}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Price</span>
                            <span>{content.isFree ? "Free" : `$${content.price}`} </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">views</span>
                            <span>{content.views}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">AI Processed</span>
                            <span>{content.transcript ? "✅ Yes": "❌ No"} </span>
                        </div>
                    </div>
                </div>
            </div>
         
    
        <AIChatSidebar
        contentId={content.id}
        hasTranscript={!!content.transcript}
        />
            </div>
    </main>
    )
}