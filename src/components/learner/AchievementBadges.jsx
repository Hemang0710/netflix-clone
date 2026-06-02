import { motion } from "motion/react";

export default function AchievementBadges({ data }) {
  const earned = data.earned || [];
  const available = data.available || [];
  const summary = data.summary || {};

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="glass-card rounded-2xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6">Achievement Progress</h2>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-slate-400">
              {summary.totalEarned} of {summary.totalAvailable} badges earned
            </p>
            <p className="text-2xl font-bold gradient-text">
              {summary.progress}%
            </p>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${summary.progress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Badges Earned" value={summary.totalEarned} />
          <StatCard label="Avg Quiz Score" value={`${data.userMetrics?.avgQuizScore}%`} />
          <StatCard label="Total Videos" value={data.userMetrics?.videosCompleted} />
          <StatCard label="Learning Hours" value={data.userMetrics?.totalHoursLearning} />
        </div>
      </div>

      {/* Earned Badges */}
      <div className="glass-card rounded-2xl p-8 border border-white/10">
        <h3 className="text-xl font-bold mb-6">
          Your Achievements ({earned.length})
        </h3>
        {earned.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {earned.map((badgeIssuance) => (
              <motion.div
                key={badgeIssuance.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 text-center cursor-pointer group hover:border-emerald-500/60 transition-all"
              >
                <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                  {badgeIssuance.badge?.icon || "⭐"}
                </div>
                <p className="font-bold text-sm mb-1">{badgeIssuance.badge?.name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(badgeIssuance.earnedAt).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">
            Keep learning to earn your first badge!
          </p>
        )}
      </div>

      {/* Available Badges */}
      {available.length > 0 && (
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold mb-6">
            Badges to Unlock ({available.length})
          </h3>
          <div className="space-y-3">
            {available.map((badge, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{badge.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold">{badge.name}</h4>
                    <p className="text-sm text-slate-400">{badge.description}</p>
                    {badge.criteria && (
                      <div className="text-xs text-slate-500 mt-2">
                        {Object.entries(badge.criteria)
                          .map(([key, val]) => `${key}: ${val}`)
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      {badge.earned ? "Earned" : "Locked"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold gradient-text">{value}</p>
    </div>
  );
}
