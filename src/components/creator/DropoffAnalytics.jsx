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

  if (loading) return <div className="p-4">Loading dropoff analytics...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!analytics) return <div className="p-4">No analytics data available</div>;

  const maxDropoff = Math.max(
    ...analytics.dropoffDistribution.map((d) => d.viewerCount)
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Dropoff Point Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Completion Rate</p>
          <p className="text-3xl font-bold">{analytics.completionRate}%</p>
        </div>
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Viewers</p>
          <p className="text-2xl font-bold">{analytics.totalViewers}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <p className="text-sm text-gray-600">Avg Watch Time</p>
          <p className="text-2xl font-bold">
            {Math.floor(analytics.averageWatchTimeSeconds / 60)}:
            {String(analytics.averageWatchTimeSeconds % 60).padStart(2, '0')}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Viewer Retention by Percentage</h3>
        <div className="space-y-3">
          {analytics.dropoffDistribution.map((item) => (
            <div key={item.watchedPercentage} className="flex items-center gap-4">
              <span className="text-sm font-medium w-16">
                {item.watchedPercentage}%
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{
                    width: `${(item.viewerCount / maxDropoff) * 100}%`,
                  }}
                >
                  {item.viewerCount > 0 && item.viewerCount}
                </div>
              </div>
              <span className="text-sm text-gray-600">{item.viewerCount} viewers</span>
            </div>
          ))}
        </div>
      </div>

      {analytics.criticalDropoffPoints.length > 0 && (
        <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Critical Dropoff Points Detected
          </p>
          <p className="text-sm text-gray-600">
            Viewers are dropping off at {analytics.criticalDropoffPoints.join('%, ')}%
            of watch time. Consider restructuring your content or adding more engaging
            elements at these points.
          </p>
        </div>
      )}
    </div>
  );
}
