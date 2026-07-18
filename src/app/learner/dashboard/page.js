"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import AnalyticsDashboard from "@/components/learner/AnalyticsDashboard";
import GoalsTracker from "@/components/learner/GoalsTracker";
import PerformanceChart from "@/components/learner/PerformanceChart";
import RecommendationCard from "@/components/learner/RecommendationCard";
import SubjectBreakdown from "@/components/learner/SubjectBreakdown";
import HighlightLibrary from "@/components/learner/HighlightLibrary";
import AchievementBadges from "@/components/learner/AchievementBadges";
import StudyStreakWidget from "@/components/learner/StudyStreakWidget";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "goals", label: "Learning Goals" },
  { id: "performance", label: "Performance" },
  { id: "subjects", label: "Subjects" },
  { id: "time", label: "Time Analytics" },
  { id: "recommendations", label: "Recommendations" },
  { id: "highlights", label: "Notes & Highlights" },
  { id: "badges", label: "Achievements" },
];

export default function LearnerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [goals, performance, recommendations, subjects, time, highlights, badges] =
          await Promise.all([
            fetch("/api/learner/analytics/goals").then((r) => r.json()),
            fetch("/api/learner/analytics/performance?period=month").then((r) =>
              r.json()
            ),
            fetch("/api/learner/analytics/recommendations").then((r) =>
              r.json()
            ),
            fetch("/api/learner/analytics/subjects").then((r) => r.json()),
            fetch("/api/learner/analytics/time?range=month").then((r) =>
              r.json()
            ),
            fetch("/api/learner/highlights").then((r) => r.json()),
            fetch("/api/learner/badges").then((r) => r.json()),
          ]);

        setData({
          goals,
          performance,
          recommendations,
          subjects,
          time,
          highlights,
          badges,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-white text-xl">Loading your learning dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black mb-2">Learning Dashboard</h1>
          <p className="text-slate-400">Track your progress, goals, and achievements</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 sticky top-0 z-40 bg-[#050508]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto gap-1 no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <QuickStatCard
                label="Total Learning Time"
                value={`${data.time?.summary?.totalHours || 0}h`}
                color="from-indigo-500/20 to-violet-500/20"
              />
              <QuickStatCard
                label="Avg Quiz Score"
                value={`${data.performance?.summary?.avgQuizScore || 0}%`}
                color="from-violet-500/20 to-pink-500/20"
              />
              <QuickStatCard
                label="Study Streak"
                value={`${data.performance?.summary?.currentStreak || 0}d`}
                color="from-cyan-500/20 to-blue-500/20"
              />
              <QuickStatCard
                label="Goals Completed"
                value={`${data.goals?.filter((g) => g.status === "completed").length || 0}`}
                color="from-emerald-500/20 to-teal-500/20"
              />
            </div>

            {/* Study Streak Widget */}
            {data.performance && (
              <StudyStreakWidget data={data.performance.summary} />
            )}

            {/* Performance Overview */}
            {data.performance && (
              <PerformanceChart data={data.performance} />
            )}

            {/* Active Goals */}
            {data.goals && (
              <GoalsTracker
                goals={data.goals.filter((g) => g.status === "active")}
                compact
              />
            )}

            {/* Quick Recommendations */}
            {data.recommendations && (
              <div className="glass-card rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold mb-6">Next Steps</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.recommendations.recommendations?.slice(0, 2).map((rec, i) => (
                    <RecommendationCard key={i} recommendation={rec} />
                  ))}
                </div>
              </div>
            )}

            {/* Top Achievements */}
            {data.badges && (
              <div className="glass-card rounded-2xl p-8 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Recent Achievements</h2>
                  <Link
                    href="#badges"
                    onClick={() => setActiveTab("badges")}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.badges.earned?.slice(0, 4).map((badge) => (
                    <div
                      key={badge.id}
                      className="text-center p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="text-4xl mb-2">{badge.badge.icon}</div>
                      <p className="font-semibold text-sm">{badge.badge.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "goals" && data.goals && (
          <GoalsTracker goals={data.goals} />
        )}

        {activeTab === "performance" && data.performance && (
          <AnalyticsDashboard data={data.performance} />
        )}

        {activeTab === "subjects" && data.subjects && (
          <SubjectBreakdown data={data.subjects} />
        )}

        {activeTab === "time" && data.time && (
          <TimeAnalyticsView data={data.time} />
        )}

        {activeTab === "recommendations" && data.recommendations && (
          <RecommendationsView data={data.recommendations} />
        )}

        {activeTab === "highlights" && data.highlights && (
          <HighlightLibrary data={data.highlights} />
        )}

        {activeTab === "badges" && data.badges && (
          <AchievementBadges data={data.badges} />
        )}
      </div>
    </div>
  );
}

function QuickStatCard({ label, value, color }) {
  return (
    <div
      className={`glass-card rounded-xl p-6 border border-white/10 bg-linear-to-br ${color}`}
    >
      <p className="text-slate-400 text-sm font-semibold mb-2">{label}</p>
      <p className="text-3xl font-black gradient-text">{value}</p>
    </div>
  );
}

function TimeAnalyticsView({ data }) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6">Learning Time Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem
            label="Total Hours"
            value={`${data.summary.totalHours}h`}
          />
          <StatItem
            label="Avg Daily"
            value={`${data.summary.avgDailyHours}h`}
          />
          <StatItem label="Days Active" value={data.summary.daysActive} />
          <StatItem
            label="Consistency"
            value={`${data.summary.consistencyScore}%`}
          />
        </div>
      </div>

      {/* Daily breakdown chart would go here */}
      <div className="glass-card rounded-2xl p-8 border border-white/10">
        <h3 className="text-xl font-bold mb-4">Recent Study Sessions</h3>
        <div className="space-y-2">
          {data.timePerLesson?.slice(0, 5).map((lesson, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
              <div className="flex-1">
                <p className="font-semibold text-sm">{lesson.title}</p>
                <p className="text-xs text-slate-500">{lesson.genre}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{lesson.hoursSpent}h</p>
                <p className="text-xs text-slate-500">{lesson.percentWatched}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendationsView({ data }) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6">Personalized Recommendations</h2>
        <div className="space-y-4">
          {data.recommendations?.map((rec, i) => (
            <RecommendationCard key={i} recommendation={rec} />
          ))}
        </div>
      </div>

      {data.weakAreas?.length > 0 && (
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold mb-4">Areas to Improve</h3>
          <div className="space-y-3">
            {data.weakAreas.map((area, i) => (
              <div key={i} className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="font-semibold">{area.subject}</p>
                <p className="text-sm text-slate-400">Average Score: {Math.round(area.avg_score)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="p-4 rounded-lg bg-white/5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-black gradient-text">{value}</p>
    </div>
  );
}
