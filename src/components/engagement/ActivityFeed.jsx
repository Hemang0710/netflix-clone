"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";

export default function ActivityFeed({ contentId = null, limit = 10 }) {
  const [activities, setActivities] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [feedRes, activeRes] = await Promise.all([
          fetch(`/api/activity-feed?limit=${limit}${contentId ? `&contentId=${contentId}` : ""}`),
          fetch("/api/activity-feed/active-now" + (contentId ? `?contentId=${contentId}` : "")),
        ]);

        const feedData = await feedRes.json();
        const activeData = await activeRes.json();

        setActivities(feedData.activities || []);
        setActiveCount(activeData.activeNow || 0);
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [contentId, limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Active Now Badge */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm text-emerald-300 font-medium">
            {activeCount} {activeCount === 1 ? "learner" : "learners"} studying right now
          </span>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No recent activity. Be the first to start!
          </div>
        ) : (
          activities.map((activity, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
            >
              {/* Avatar */}
              {activity.user?.profile?.avatarUrl ? (
                <Image
                  src={activity.user.profile.avatarUrl}
                  alt={activity.user.profile.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {activity.user?.profile?.name?.charAt(0) || "?"}
                </div>
              )}

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium text-white">
                    {activity.user?.profile?.name || "Learner"}
                  </span>
                  <span className="text-slate-400"> {activity.action}</span>
                </p>

                {activity.type === "quiz" && (
                  <p className="text-xs text-indigo-300 font-semibold">
                    Score: {activity.score}/100
                  </p>
                )}

                <p className="text-xs text-slate-500 mt-0.5">
                  {formatTime(activity.timestamp)}
                </p>
              </div>

              {/* Badge */}
              {activity.type === "quiz" && activity.score >= 90 && (
                <span className="text-lg flex-shrink-0">⭐</span>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function formatTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
