"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";

export default function StudyPartnerRecommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch("/api/recommendations/study-partners");
        const data = await res.json();
        setRecommendations(data);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
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
          <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!recommendations?.recommendations?.length) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg mb-4">No recommendations yet</p>
        <p className="text-sm">
          Complete more courses and master concepts to get personalized study partner suggestions
        </p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-4">
      {/* Alert for weak topics */}
      {recommendations.userWeakSpots && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm"
        >
          <p className="font-semibold mb-1">🎯 {recommendations.message}</p>
          <p className="text-xs text-amber-300/80">
            Areas to focus on: {recommendations.userWeakSpots}
          </p>
        </motion.div>
      )}

      {/* Recommendations List */}
      <div className="space-y-3">
        {recommendations.recommendations?.slice(0, 5).map((partner, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setSelectedPartner(partner)}
            className="p-5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 hover:border-indigo-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-white mb-1">{partner.name}</h3>
                <p className="text-xs text-slate-400">
                  Strength: {partner.complementaryStrength}
                </p>
              </div>
              <span className="text-2xl">👥</span>
            </div>

            <p className="text-sm text-slate-300 mb-3">{partner.reason}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs bg-indigo-500/20 px-3 py-1 rounded-full text-indigo-300 font-semibold">
                {partner.suggestedActivity}
              </span>
              <span className="text-xs text-slate-500">→</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full mt-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-lg transition-all"
      >
        Find Study Partners Now
      </motion.button>
    </motion.div>
  );
}
