import Link from "next/link";

export default async function SuccessPage({searchParams}) {
    const {session_id} = await searchParams

    return(
        <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
            <div className="text-center max-w-md">
                <div className="text-6x1 mb-6">🎉</div>
                <h1 className="text-4x1 font-black mb-4">
                    You&apos;re subscribed!
                </h1>
                <p className="text-zinc-400 mb-8">
                    Welcome to StreamAI. Your account is now active.
                </p>
                <Link
                  href="/browse"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors inline-block">
                    Start Watching →
                  </Link>
            </div>
        </main>
    )
}