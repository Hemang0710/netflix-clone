"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function BadgeUnlocks() {
  const [badges, setBadges] = useState({
    unlockedBadges: [],
    nextBadges: [],
  });
  const [loading, setLoading] = useState(true);
  const [showClaim, setShowClaim] = useState(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch("/api/badges/unlock-tiers");
        const data = await res.json();
        setBadges(data);
      } catch (error) {
        console.error("Failed to fetch badges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  const handleClaimBadge = async (badgeName) => {
    try {
      const res = await fetch("/api/badges/unlock-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeName }),
      });

      const data = await res.json();
      if (data.success) {
        setShowClaim(badgeName);
        setBadges((prev) => ({
          ...prev,
          unlockedBadges: prev.unlockedBadges.filter((b) => b.name !== badgeName),
        }));
        setTimeout(() => setShowClaim(null), 3000);
      }
    } catch (error) {
      console.error("Failed to claim badge:", error);
    }
  };

  if (loading) return null;

  return (
    <motion.div className="space-y-6">
      {/* Newly Unlocked Badges */}
      <AnimatePresence>
        {badges.unlockedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wide">
              ✨ Ready to Claim
            </h3>
            <div className="space-y-2">
              {badges.unlockedBadges.map((badge) => (
                <motion.div
                  key={badge.name}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{badge.icon}</span>
                    <div>
                      <p className="font-bold text-white">{badge.name}</p>
                      <p className="text-xs text-slate-300">
                        Unlocks: {badge.unlocksFeature}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClaimBadge(badge.name)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-lg transition-all text-sm whitespace-nowrap"
                  >
                    Claim 🎉
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Toward Next Badges */}
      {badges.nextBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            Next Goals
          </h3>
          <div className="space-y-3">
            {badges.nextBadges.map((badge) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl opacity-60">{badge.icon}</span>
                    <span className="text-sm font-medium text-white">{badge.name}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-300">
                    {badge.progress}%
                  </span>
                </div>

                <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${badge.progress}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  />
                </div>

                <p className="text-xs text-slate-400">
                  {badge.remaining} more {badge.type.replace(/_/g, " ")} to unlock
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Claim Celebration */}
      <AnimatePresence>
        {showClaim && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-4 right-4 p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/50 rounded-xl shadow-lg z-50"
          >
            <p className="text-white font-bold">🎊 Badge Claimed!</p>
            <p className="text-sm text-slate-300">{showClaim}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
