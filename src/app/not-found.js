import Link from "next/link";

export default function NotFound(){
    return (
        <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-9xl font-black text-red-600 mb-4">404</h1>
                <p className="text-2xl font-bold mb-4">Page not found</p>
                <p className="text-zinc-400 mb-8">
                    The page you &apostre looking for doesn&apostt exist.
                </p>
                <Link 
                    href="/browse"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded transition-colors">
                        Go to Browse
                    </Link>
            </div>
        </main>
    )
}