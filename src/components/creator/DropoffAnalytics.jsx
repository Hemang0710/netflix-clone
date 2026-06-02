'use client';

import { useState, useEffect } from 'react';

export default function DropoffAnalytics({ contentId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(
          `/api/creator/analytics/drop-off?contentId=${contentId}`
        );
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [contentId]);

  if (loading) return <div className="p-4 text-slate-400">Loading dropoff analytics...</div>;
  if (error) return <div className="p-4 text-red-400">Error: {error}</div>;
  if (!analytics) return <div className="p-4 text-slate-400">No analytics data available</div>;

  const maxDropoff = Math.max(
    ...analytics.dropoffDistribution.map((d) => d.viewerCount)
  );

  return (
    <div className="glass-card rounded-2xl shadow-md p-6 border border-white/10">
      <h2 className="text-2xl font-bold mb-6 text-white">Dropoff Point Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-500/15 border border-emerald-500/20 p-4 rounded-lg">
          <p className="text-sm text-slate-400">Completion Rate</p>
          <p className="text-3xl font-bold text-white mt-1">{analytics.completionRate}%</p>
        </div>
        <div className="bg-indigo-500/15 border border-indigo-500/20 p-4 rounded-lg">
          <p className="text-sm text-slate-400">Total Viewers</p>
          <p className="text-2xl font-bold text-white mt-1">{analytics.totalViewers}</p>
        </div>
        <div className="bg-purple-500/15 border border-purple-500/20 p-4 rounded-lg">
          <p className="text-sm text-slate-400">Avg Watch Time</p>
          <p className="text-2xl font-bold text-white mt-1">
            {Math.floor(analytics.averageWatchTimeSeconds / 60)}:
            {String(analytics.averageWatchTimeSeconds % 60).padStart(2, '0')}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Viewer Retention by Percentage</h3>
        <div className="space-y-3">
          {analytics.dropoffDistribution.map((item) => (
            <div key={item.watchedPercentage} className="flex items-center gap-4">
              <span className="text-sm font-medium w-16 text-slate-300">
                {item.watchedPercentage}%
              </span>
              <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-linear-to-r from-emerald-400 to-indigo-500 h-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{
                    width: `${(item.viewerCount / maxDropoff) * 100}%`,
                  }}
                >
                  {item.viewerCount > 0 && item.viewerCount}
                </div>
              </div>
              <span className="text-sm text-slate-400">{item.viewerCount} viewers</span>
            </div>
          ))}
        </div>
      </div>

      {analytics.criticalDropoffPoints.length > 0 && (
        <div className="bg-red-500/15 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-sm font-semibold text-red-300 mb-2">
            Critical Dropoff Points Detected
          </p>
          <p className="text-sm text-slate-400">
            Viewers are dropping off at {analytics.criticalDropoffPoints.join('%, ')}%
            of watch time. Consider restructuring your content or adding more engaging
            elements at these points.
          </p>
        </div>
      )}
    </div>
  );
}
