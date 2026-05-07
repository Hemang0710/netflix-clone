"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function UserBadgesShowcase({ userId }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/badges/user/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBadges(data.data || []);
        } else {
          setError(data.error);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-white font-bold text-lg">Earned Badges</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse aspect-square bg-white/5 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl">🏅</span>
        <p className="text-slate-500 mt-2">No badges earned yet. Keep learning!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg">
        Earned Badges ({badges.length})
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {badges.map((issuance) => (
          <Link
            key={issuance.id}
            href={`/verify/${issuance.verificationCode}`}
            className="group"
          >
            <div className="aspect-square rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 p-3 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400/60 hover:from-indigo-500/30 hover:to-purple-500/30 transition-all">
              {issuance.badge?.icon ? (
                <div
                  className="w-12 h-12 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: issuance.badge.icon }}
                />
              ) : (
                <span className="text-2xl">🏆</span>
              )}
              <p className="text-xs text-slate-300 mt-2 text-center line-clamp-2">
                {issuance.badge?.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center">
        Click a badge to verify and share
      </p>
    </div>
  );
}
