export default function SkeletonCard(){
    return (
        <div className="shrink-0 w-36 h-52 rounded-md bg-zinc-800 animate-pulse"/>

    )
}

export function SkeletonRow(){
    return(
        <div className="mb-8 px-12">
            {/* Title skeleton */}
        <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse mb-4"/>
            {/* Cards skeleton */}
        <div className="flex gap-3 overflow-hidden">
            {Array.from({length:8}).map((_,i)=>(
                <SkeletonCard key={i}/>
            ))}
        </div>
        </div>
    )
}

export function SkeletoHero(){
    return(
        <div className="realtive h-[85vh] bg-zinc-900 animate-pulse flex items-end pb-32 px-12">
            <div className="max-w-x1 space-y-4">
                <div className="h-12 w-80 bg-zinc-800 rounded"/>
                <div className="h-4 w-48 bg-zinc-800 rounded"/>
                <div className="h-4 w-64 bg-zinc-800 rounded"/>
                <div className="flex gap-3 mt-6">
                    <div className="h-12 w-28 bg-zinc-700 rounded"/>
                    <div className="h-12 w-32 bg-zinc-700 rounded"/>
                </div>
            </div>
        </div>
    )
}