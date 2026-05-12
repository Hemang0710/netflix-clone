'use client';

import { useState, useEffect } from 'react';

export default function ContentGapDetector({ contentId }) {
  const [gaps, setGaps] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGaps();
  }, [contentId]);

  const fetchGaps = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/creator/analytics/content-gaps?contentId=${contentId}`
      );
      if (!res.ok) throw new Error('Failed to fetch content gaps');
      const data = await res.json();
      setGaps(data.data);
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await fetch(
        `/api/creator/analytics/content-gaps?contentId=${contentId}&analyze=true`
      );
      if (!res.ok) throw new Error('Failed to get AI analysis');
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="p-4">Loading content gap analysis...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!gaps) return <div className="p-4">No gap data available</div>;

  const priorityColors = {
    high: 'bg-red-50 border-l-4 border-red-500',
    medium: 'bg-yellow-50 border-l-4 border-yellow-500',
    low: 'bg-green-50 border-l-4 border-green-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Content Gap Detector</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Gaps Identified</p>
          <p className="text-3xl font-bold">{gaps.totalGapsIdentified}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-lg font-semibold text-purple-700">
            {gaps.recommendation}
          </p>
        </div>
      </div>

      {gaps.topGaps.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Top Content Gaps</h3>
          <div className="space-y-3">
            {gaps.topGaps.map((gap, idx) => (
              <div
                key={idx}
                className={`p-4 rounded ${priorityColors[gap.priority]}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800">{gap.concept}</h4>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      gap.priority === 'high'
                        ? 'bg-red-200 text-red-800'
                        : gap.priority === 'medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {gap.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Asked for by {gap.timesAskedFor} viewer{gap.timesAskedFor !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {gaps.totalGapsIdentified > gaps.topGaps.length && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">All Identified Gaps</h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {gaps.allGaps.map((gap, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <span className="text-sm font-medium">{gap.concept}</span>
                <span className="text-xs text-gray-600">
                  {gap.timesAskedFor} request{gap.timesAskedFor !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!analysis && (
        <button
          onClick={handleAIAnalysis}
          disabled={analyzing}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded mb-6 transition"
        >
          {analyzing ? 'Analyzing...' : 'Get AI Analysis & Recommendations'}
        </button>
      )}

      {analysis && (
        <div className="bg-indigo-50 p-4 rounded border-l-4 border-indigo-500">
          <h4 className="font-semibold text-gray-800 mb-2">AI Analysis & Recommendations</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {analysis.analysis}
          </div>
        </div>
      )}
    </div>
  );
}
