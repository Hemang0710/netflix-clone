"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";

export default function FeatureUnlocks() {
  const [features, setFeatures] = useState({
    unlocked: [],
    locked: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const res = await fetch("/api/features/unlock-status");
        const data = await res.json();
        setFeatures(data);
      } catch (error) {
        console.error("Failed to fetch features:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Unlocked Features */}
      {features.unlocked.length > 0 && (
        <motion.div className="space-y-4">
          <h3 className="text-lg font-bold text-emerald-400">
            ✅ Unlocked Features ({features.unlocked.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.unlocked.map((feature) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{feature.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">{feature.name}</p>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Locked Features */}
      {features.locked.length > 0 && (
        <motion.div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-300">🔒 Coming Soon</h3>
          <div className="space-y-3">
            {features.locked.map((feature, idx) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl opacity-40">{feature.icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm">{feature.name}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Progress</span>
                    <span className="text-xs font-bold text-indigo-400">
                      {feature.progress}%
                    </span>
                  </div>

                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${feature.progress}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    <strong className="text-slate-300">
                      {feature.remaining} more {feature.type.replace(/_/g, " ")}
                    </strong>
                    {" to unlock"}
                  </p>
                </div>

                {/* Call to Action */}
                <Link
                  href="/learn"
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  Keep learning →
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-slate-500 text-center">
            {features.unlockedCount} of {features.totalFeatures} features unlocked
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
