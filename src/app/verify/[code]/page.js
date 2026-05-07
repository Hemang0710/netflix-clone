import { notFound } from "next/navigation";

async function fetchBadgeData(code) {
  try {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = process.env.VERCEL_URL || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/badges/verify/${code}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching badge data:", error);
    return null;
  }
}

export default async function BadgeVerificationPage({ params }) {
  const { code } = await params;
  const data = await fetchBadgeData(code);

  if (!data) {
    notFound();
  }

  const { badge, learner, earnedAt, verified, hederaTxHash } = data;

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Verification status */}
        <div
          className={`p-4 rounded-lg mb-8 ${
            verified
              ? "bg-emerald-500/10 border border-emerald-500/30"
              : "bg-yellow-500/10 border border-yellow-500/30"
          }`}
        >
          <p className={verified ? "text-emerald-400" : "text-yellow-400"}>
            {verified ? "✓ Verified on Hedera" : "⚠ Verification pending"}
          </p>
        </div>

        {/* Badge display */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center p-6 shadow-2xl shadow-indigo-500/50">
              {badge?.icon ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: badge.icon }}
                />
              ) : (
                <span className="text-7xl">🏆</span>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-black mb-3">{badge?.name}</h1>
            <p className="text-xl text-slate-400">{learner?.name}</p>
            <p className="text-slate-600 text-sm">{learner?.email}</p>
          </div>

          {/* Details */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-slate-500 text-sm mb-1">Earned on</p>
                <p className="text-white font-semibold">
                  {new Date(earnedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-1">Verification</p>
                <p className={verified ? "text-emerald-400 font-semibold" : "text-yellow-400 font-semibold"}>
                  {verified ? "Verified" : "Pending"}
                </p>
              </div>
            </div>

            {/* Badge description */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-slate-500 text-sm mb-2">Badge Description</p>
              <p className="text-slate-300">{badge?.description}</p>
            </div>

            {/* Criteria */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-slate-500 text-sm mb-3">Criteria Met:</p>
              <ul className="text-sm text-slate-300 space-y-2">
                {badge?.criteria?.minQuizScore && (
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Quiz Score: ≥{badge.criteria.minQuizScore}%
                  </li>
                )}
                {badge?.criteria?.minFlashcardReps && (
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Flashcard Reps: ≥{badge.criteria.minFlashcardReps}
                  </li>
                )}
                {badge?.criteria?.minTimeSpent && (
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Time Spent: ≥{badge.criteria.minTimeSpent} minutes
                  </li>
                )}
              </ul>
            </div>

            {/* Blockchain verification */}
            {hederaTxHash && (
              <div className="border-t border-white/10 pt-6">
                <p className="text-slate-500 text-sm mb-2">Blockchain Anchor</p>
                <p className="text-xs font-mono text-indigo-300 break-all bg-black/30 p-3 rounded mb-2">
                  {hederaTxHash}
                </p>
                <a
                  href={`https://hashscan.io/testnet/transaction/${hederaTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                >
                  View on Hedera Hashscan ↗
                </a>
              </div>
            )}
          </div>

          {/* Share CTA */}
          <div className="pt-4">
            <p className="text-slate-500 text-sm mb-3">
              Share this achievement on your profile
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `I just earned the "${badge?.name}" badge on LearnAI! Verify it here: ${typeof window !== "undefined" ? window.location.href : ""}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] rounded-lg text-sm font-semibold transition-colors"
              >
                Share on 𝕏
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#0A66C2] hover:bg-[#095195] rounded-lg text-sm font-semibold transition-colors"
              >
                Share on LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Badge Verification - LearnAI",
  description: "Verify blockchain-backed credentials on LearnAI",
};
