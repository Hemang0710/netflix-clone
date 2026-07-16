"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

export default function QuizChallenge({ contentId, onChallengeCreated }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await fetch(`/api/challenges/quiz-challenge?contentId=${contentId}`);
        const data = await res.json();
        setChallenges(data.challenges || []);
      } catch (error) {
        console.error("Failed to fetch challenges:", error);
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      fetchChallenges();
    }
  }, [contentId]);

  const handleCreateChallenge = async () => {
    try {
      const res = await fetch("/api/challenges/quiz-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          leaderboardMode: true, // Open challenge
        }),
      });

      const data = await res.json();
      setChallenges((prev) => [data.challenge, ...prev]);
      setShowCreateModal(false);
      onChallengeCreated?.(data);
    } catch (error) {
      console.error("Failed to create challenge:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div className="space-y-4">
      {/* Create Challenge Button */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowCreateModal(true)}
        className="w-full p-4 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-dashed border-amber-500/30 hover:border-amber-500/50 transition-all text-amber-300 font-semibold flex items-center justify-center gap-2"
      >
        <span>⚔️</span> Challenge Friends
      </motion.button>

      {/* Active Challenges */}
      {challenges.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          No active challenges. Be the first to create one!
        </div>
      ) : (
        <div className="space-y-2">
          {challenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedChallenge(challenge.id)}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm mb-1">
                    {challenge.content?.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {challenge._count?.participants || 0} participants
                  </p>
                </div>
                <span className="text-2xl flex-shrink-0">🏆</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-sm w-full space-y-4"
            >
              <div className="text-center">
                <span className="text-4xl mb-2 block">⚔️</span>
                <h3 className="text-xl font-bold text-white mb-1">Create Challenge</h3>
                <p className="text-sm text-slate-400">
                  Challenge your friends to a quiz duel!
                </p>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-300 mb-2 block">
                    Challenge Type
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs hover:bg-indigo-600/30 transition-all">
                      🎯 Private
                    </button>
                    <button className="p-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/10 transition-all">
                      🌍 Global
                    </button>
                  </div>
                </label>

                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  <p className="font-semibold mb-1">⚡ How it works:</p>
                  <ul className="space-y-1 text-emerald-300/80">
                    <li>• Send link to friends</li>
                    <li>• Race to complete the quiz</li>
                    <li>• Highest score wins</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChallenge}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge Details Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <ChallengeLiveLeaderboard
            challengeId={selectedChallenge}
            onClose={() => setSelectedChallenge(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChallengeLiveLeaderboard({ challengeId, onClose }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await fetch(`/api/challenges/quiz-challenge?challengeId=${challengeId}`);
        const data = await res.json();
        setChallenge(data);
      } catch (error) {
        console.error("Failed to fetch challenge:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
    const interval = setInterval(fetchChallenge, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [challengeId]);

  if (loading || !challenge) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-md w-full space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Live Leaderboard 🏆</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {challenge.leaderboard?.slice(0, 5).map((entry, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-black text-lg w-6 text-center">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{entry.name}</p>
                  <p className="text-xs text-slate-400">
                    {entry.timeSeconds}s ago
                  </p>
                </div>
              </div>
              <span className="text-lg font-black text-indigo-400">{entry.score}</span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all"
        >
          Accept Challenge
        </button>
      </motion.div>
    </motion.div>
  );
}
