import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BadgeUnlocks from "@/components/engagement/BadgeUnlocks";
import FeatureUnlocks from "@/components/engagement/FeatureUnlocks";
import ActivityFeed from "@/components/engagement/ActivityFeed";

export const metadata = {
  title: "Engagement Hub",
  description: "Track your progress, unlock features, and connect with learners",
};

export default async function EngagementPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#050508]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Your <span className="gradient-text">Engagement</span> Hub
          </h1>
          <p className="text-xl text-slate-400">
            Track progress, unlock features, and compete with the community
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Badge Unlocks Section */}
            <section className="rounded-2xl bg-white/5 border border-white/10 p-8">
              <h2 className="text-2xl font-black mb-6">🎖️ Badges & Achievements</h2>
              <BadgeUnlocks />
            </section>

            {/* Feature Unlocks Section */}
            <section className="rounded-2xl bg-white/5 border border-white/10 p-8">
              <h2 className="text-2xl font-black mb-6">🔓 Unlock New Features</h2>
              <p className="text-slate-400 text-sm mb-6">
                Engage more to unlock premium tools and community features
              </p>
              <FeatureUnlocks />
            </section>
          </div>

          {/* Right Column - Activity */}
          <div className="lg:col-span-1">
            <section className="rounded-2xl bg-white/5 border border-white/10 p-8 sticky top-24">
              <h2 className="text-2xl font-black mb-6">📊 Community Activity</h2>
              <ActivityFeed limit={8} />

              {/* Quick Stats */}
              <div className="mt-8 space-y-4 border-t border-white/10 pt-8">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                  Growth Tips
                </h3>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex gap-2">
                    <span>🔥</span>
                    <span>Maintain a 7-day streak to unlock group challenges</span>
                  </li>
                  <li className="flex gap-2">
                    <span>🎯</span>
                    <span>Complete 50 quizzes to access AI debate partner</span>
                  </li>
                  <li className="flex gap-2">
                    <span>🤝</span>
                    <span>Post in study groups to become a mentor</span>
                  </li>
                  <li className="flex gap-2">
                    <span>🧠</span>
                    <span>Master 10 concepts to use visual mapping tools</span>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Section - Recommendations */}
        <section className="mt-12 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-8">
          <h2 className="text-2xl font-black mb-6">🎯 Personalized Recommendations</h2>
          <RecommendationsSection />
        </section>
      </div>
    </main>
  );
}

async function RecommendationsSection() {
  try {
    // This would be fetched with proper auth
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Study Partners */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-6">
          <h3 className="font-bold text-white mb-4">👥 Suggested Study Partners</h3>
          <p className="text-slate-400 text-sm mb-4">
            Connect with learners who can help you master weak topics
          </p>
          <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all text-sm">
            See Recommendations →
          </button>
        </div>

        {/* Courses */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-6">
          <h3 className="font-bold text-white mb-4">📚 Courses to Fill Gaps</h3>
          <p className="text-slate-400 text-sm mb-4">
            Recommended courses based on your learning profile
          </p>
          <button className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-all text-sm">
            View Path →
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Failed to load recommendations:", error);
    return null;
  }
}
