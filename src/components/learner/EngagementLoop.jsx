"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

export default function EngagementLoop() {
  const [data, setData] = useState({
    streak: null,
    dueToday: { flashcards: 0, concepts: 0 },
    leaderboard: { rank: null, totalUsers: 0, userScore: 0 },
    milestone: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streakRes, flashcardsRes, conceptsRes, leaderboardRankRes, milestoneRes] =
          await Promise.all([
            fetch("/api/streaks").then((r) => r.json()),
            fetch("/api/flashcards/due").then((r) => r.json()),
            fetch("/api/concepts/due").then((r) => r.json()),
            fetch("/api/user/leaderboard-rank").then((r) => r.json()),
            fetch("/api/milestones").then((r) => r.json()),
          ]);

        setData({
          streak: streakRes.reviewStreak || { current: 0, best: 0 },
          dueToday: {
            flashcards: flashcardsRes.due || 0,
            concepts: conceptsRes.count || 0,
          },
          leaderboard: {
            rank: leaderboardRankRes.rank || null,
            totalUsers: leaderboardRankRes.totalUsers || 0,
            userScore: leaderboardRankRes.userScore || 0,
          },
          milestone: milestoneRes.nextMilestone || null,
        });
      } catch (error) {
        console.error("Failed to fetch engagement loop data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 border border-white/10 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  const totalDue = data.dueToday.flashcards + data.dueToday.concepts;
  const streakMotivation =
    data.streak.current >= 7
      ? "🎉 Weekly Streak!"
      : data.streak.current >= 3
        ? "💪 Keep Going!"
        : data.streak.current === 1
          ? "🚀 Day 1!"
          : "⏰ Start Your Streak!";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-black mb-2">Your Learning Journey</h2>
        <p className="text-slate-400">Stay motivated with your daily engagement metrics</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Streak - Prominent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 lg:col-span-1 glass-card rounded-2xl p-8 border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-red-500/10"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold mb-1">🔥 Daily Streak</h3>
              <p className="text-sm text-slate-400">Keep the momentum going!</p>
            </div>
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300">
              {streakMotivation}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs text-slate-400 mb-2">Current Streak</p>
              <p className="text-5xl font-black text-orange-400">{data.streak.current}</p>
              <p className="text-xs text-slate-500 mt-1">days</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">Best Streak</p>
              <p className="text-5xl font-black text-amber-400">{data.streak.best}</p>
              <p className="text-xs text-slate-500 mt-1">days</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${
                  i < data.streak.current
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                    : "bg-white/5 border-white/10 text-slate-600"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-slate-400">
            {data.streak.current < 7
              ? `${7 - data.streak.current} days until weekly achievement 🎯`
              : "🎊 Amazing consistency!"}
          </p>

          {data.streak.current === 0 && (
            <Link
              href="/learn"
              className="mt-4 block w-full text-center py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg transition-all text-sm"
            >
              Start Learning Now
            </Link>
          )}
        </motion.div>

        {/* Due Today - Quick Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-8 border border-white/10 bg-gradient-to-br from-indigo-500/10 to-violet-500/10"
        >
          <h3 className="text-xl font-bold mb-1">📚 Due Today</h3>
          <p className="text-sm text-slate-400 mb-6">Review items waiting for you</p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">Flashcards</p>
                  <p className="text-2xl font-black text-indigo-400">{data.dueToday.flashcards}</p>
                </div>
                <span className="text-3xl">🎴</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">Concepts</p>
                  <p className="text-2xl font-black text-violet-400">{data.dueToday.concepts}</p>
                </div>
                <span className="text-3xl">💭</span>
              </div>
            </div>

            {totalDue > 0 && (
              <Link
                href="/learn"
                className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all text-sm"
              >
                Review Now ({totalDue})
              </Link>
            )}

            {totalDue === 0 && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-sm text-emerald-400 font-semibold">✓ All caught up!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Leaderboard Ranking */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-8 border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10"
        >
          <h3 className="text-xl font-bold mb-1">🏆 Your Rank</h3>
          <p className="text-sm text-slate-400 mb-6">Community leaderboard standing</p>

          {data.leaderboard.rank ? (
            <div className="space-y-4">
              <div className="p-6 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-center">
                <p className="text-xs text-slate-400 mb-2">RANK</p>
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  #{data.leaderboard.rank}
                </p>
                <p className="text-xs text-slate-500 mt-2">of {data.leaderboard.totalUsers} learners</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400 mb-1">Score</p>
                <p className="text-3xl font-bold text-cyan-400">{data.leaderboard.userScore}</p>
              </div>

              <Link
                href="/leaderboard"
                className="w-full text-center py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-all text-sm"
              >
                View Full Leaderboard
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <p className="text-sm text-slate-400">
                Complete some activities to join the leaderboard!
              </p>
              <Link
                href="/learn"
                className="mt-3 inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-all text-xs"
              >
                Start Learning
              </Link>
            </div>
          )}
        </motion.div>

        {/* Next Milestone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2 lg:col-span-1 glass-card rounded-2xl p-8 border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
        >
          <h3 className="text-xl font-bold mb-1">🎯 Next Milestone</h3>
          <p className="text-sm text-slate-400 mb-6">Achieve your next goal</p>

          {data.milestone ? (
            <div className="space-y-4">
              <div className="p-5 rounded-lg bg-white/5 border border-emerald-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{data.milestone.icon}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold">
                    {Math.round(data.milestone.progress)}% done
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1">{data.milestone.name}</h4>
                <p className="text-xs text-slate-400">{data.milestone.description}</p>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-white/5 rounded-full border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                  style={{ width: `${Math.min(data.milestone.progress, 100)}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 text-center">
                {data.milestone.remaining > 0
                  ? `${data.milestone.remaining} more to unlock ${data.milestone.reward}`
                  : `Claim your ${data.milestone.reward}! 🎉`}
              </p>

              {data.milestone.actionUrl && (
                <Link
                  href={data.milestone.actionUrl}
                  className="w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all text-sm"
                >
                  {data.milestone.actionText || "Continue"}
                </Link>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <p className="text-sm text-slate-400">Loading your next milestone...</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
