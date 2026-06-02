import { motion } from "motion/react";

export default function StudyStreakWidget({ data }) {
  const currentStreak = data?.currentStreak || 0;
  const longestStreak = data?.longestStreak || 0;

  return (
    <div className="glass-card rounded-2xl p-8 border border-white/10 bg-gradient-to-br from-orange-500/10 to-red-500/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">🔥 Study Streak</h3>
        <div className="text-right">
          <p className="text-5xl font-black text-orange-400">{currentStreak}</p>
          <p className="text-xs text-slate-400 mt-1">days active</p>
        </div>
      </div>

      {/* Streak visualization */}
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ${
                i < currentStreak
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                  : "bg-white/5 border-white/10 text-slate-600"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-400 text-center">
          Keep it going! {7 - Math.min(currentStreak, 7)} more days for a weekly achievement
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
        <div>
          <p className="text-xs text-slate-400 mb-1">Longest Streak</p>
          <p className="text-3xl font-bold text-orange-400">{longestStreak}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">This Week</p>
          <p className="text-3xl font-bold text-indigo-400">
            {Math.min(currentStreak, 7)}/7
          </p>
        </div>
      </div>

      {/* Motivational message */}
      <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
        <p className="text-sm text-slate-300">
          {currentStreak >= 7
            ? "🎉 Amazing! You've maintained a consistent study habit!"
            : currentStreak >= 3
              ? "💪 Great progress! Don't break the chain!"
              : currentStreak === 1
                ? "🚀 You've started! Come back tomorrow!"
                : "⏰ It's time to study! Start your streak!"}
        </p>
      </div>
    </div>
  );
}
