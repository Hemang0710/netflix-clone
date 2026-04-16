import { SkeletoHero, SkeletonRow } from "@/components/SkeletonCard";

export default function BrowseLoading(){
    return (
        <main className="min-h-screen bg-zinc-950">
            {/*Navbar skeleton */}
            <div className="fixed top-0 w-full z-50 flex items-center justify-between px-12 py-4 bg-black/80">
                <div className="h-8 w-28 bg-zinc-800 rounded animate-pulse"/>
                <div className="h-8 w-28 bg-zinc-800 rounded-2xl animate-pulse"/>
            </div>

            <SkeletoHero/>

            <div className="pb-20 space-y-2 -mt-80px relative z-10">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            </div>

        </main>
    )
}