"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";

export default function CourseRecommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch("/api/recommendations/courses");
        const data = await res.json();
        setRecommendations(data);
      } catch (error) {
        console.error("Failed to fetch course recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!recommendations?.recommendations?.length) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg mb-4">No learning gaps detected</p>
        <p className="text-sm">
          You're doing great! Keep learning to see new course recommendations
        </p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-4">
      {/* Learning Path Alert */}
      {recommendations.gaps?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300"
        >
          <p className="font-semibold mb-2">📚 Suggested Learning Path</p>
          <p className="text-xs text-violet-300/80">
            Based on gaps in: {recommendations.gaps.join(", ")}
          </p>
        </motion.div>
      )}

      {/* Course Cards */}
      <div className="space-y-3">
        {recommendations.recommendations?.slice(0, 5).map((course, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-5 rounded-lg bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 hover:border-violet-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">
                  {course.title || course.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {course.reason}
                </p>
              </div>
              <span className="text-2xl flex-shrink-0">📖</span>
            </div>

            {/* Details Row */}
            <div className="grid grid-cols-3 gap-2 mb-3 py-3 border-t border-b border-white/10">
              <div>
                <p className="text-xs text-slate-400">Time</p>
                <p className="font-bold text-white">
                  {course.estimatedHours || "N/A"}h
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Difficulty</p>
                <p className="font-bold text-white">
                  {course.difficulty || "Medium"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Impact</p>
                <p className="font-bold text-emerald-400">✓ High</p>
              </div>
            </div>

            {/* Outcome */}
            <p className="text-xs text-slate-300 mb-4">
              <strong>You'll Learn:</strong> {course.outcome}
            </p>

            <Link
              href={`/browse?search=${encodeURIComponent(course.title)}`}
              className="inline-block w-full text-center py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-all text-sm"
            >
              Enroll Now
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Custom Path CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-lg bg-white/5 border border-white/10 text-center"
      >
        <p className="text-sm text-slate-300 mb-3">
          Want a full curriculum designed for you?
        </p>
        <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all text-sm">
          Create Custom Path
        </button>
      </motion.div>
    </motion.div>
  );
}
