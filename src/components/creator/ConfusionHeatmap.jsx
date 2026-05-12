'use client';

import { useState, useEffect } from 'react';

export default function ConfusionHeatmap({ contentId }) {
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await fetch(
          `/api/creator/analytics/heatmap?contentId=${contentId}`
        );
        if (!res.ok) throw new Error('Failed to fetch heatmap');
        const data = await res.json();
        setHeatmap(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
  }, [contentId]);

  if (loading) return <div className="p-4">Loading heatmap...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!heatmap) return <div className="p-4">No confusion data available</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Confusion Heatmap</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Confusion Points</p>
          <p className="text-2xl font-bold">{heatmap.totalConfusionPoints}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Viewers</p>
          <p className="text-2xl font-bold">{heatmap.totalViewers}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <p className="text-sm text-gray-600">Critical Hotspots</p>
          <p className="text-2xl font-bold">{heatmap.hotspots.length}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Hotspots (High Confusion)</h3>
        {heatmap.hotspots.length > 0 ? (
          <div className="space-y-2">
            {heatmap.hotspots.map((hotspot) => (
              <div
                key={hotspot.second}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <span className="text-sm">
                  At {Math.floor(hotspot.second / 60)}:
                  {String(hotspot.second % 60).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        hotspot.severity === 'high'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{
                        width: `${(hotspot.confusionCount / Math.max(...heatmap.hotspots.map(h => h.confusionCount))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {hotspot.confusionCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No critical hotspots detected</p>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
        <p className="text-sm font-semibold text-gray-700">Recommendation</p>
        <p className="text-sm text-gray-600 mt-1">
          Focus on improving explanations around {heatmap.hotspots[0]?.second || 'your content'}.
          Consider adding visual aids or breaking down complex concepts.
        </p>
      </div>
    </div>
  );
}
