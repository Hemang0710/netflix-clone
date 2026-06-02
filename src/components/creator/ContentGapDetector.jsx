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

  if (loading) return <div className="p-4 text-slate-400">Loading content gap analysis...</div>;
  if (error) return <div className="p-4 text-red-400">Error: {error}</div>;
  if (!gaps) return <div className="p-4 text-slate-400">No gap data available</div>;

  const priorityColors = {
    high: 'bg-red-500/15 border-l-4 border-red-500',
    medium: 'bg-yellow-500/15 border-l-4 border-yellow-500',
    low: 'bg-emerald-500/15 border-l-4 border-emerald-500',
  };

  return (
    <div className="glass-card rounded-2xl shadow-md p-6 border border-white/10">
      <h2 className="text-2xl font-bold mb-6 text-white">Content Gap Detector</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-indigo-500/15 border border-indigo-500/20 p-4 rounded-lg">
          <p className="text-sm text-slate-400">Total Gaps Identified</p>
          <p className="text-3xl font-bold text-white mt-1">{gaps.totalGapsIdentified}</p>
        </div>
        <div className="bg-purple-500/15 border border-purple-500/20 p-4 rounded-lg">
          <p className="text-sm text-slate-400">Status</p>
          <p className="text-lg font-semibold text-purple-300 mt-1">
            {gaps.recommendation}
          </p>
        </div>
      </div>

      {gaps.topGaps.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Top Content Gaps</h3>
          <div className="space-y-3">
            {gaps.topGaps.map((gap, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${priorityColors[gap.priority]}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{gap.concept}</h4>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      gap.priority === 'high'
                        ? 'bg-red-500/25 text-red-300'
                        : gap.priority === 'medium'
                        ? 'bg-yellow-500/25 text-yellow-300'
                        : 'bg-emerald-500/25 text-emerald-300'
                    }`}
                  >
                    {gap.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Asked for by {gap.timesAskedFor} viewer{gap.timesAskedFor !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {gaps.totalGapsIdentified > gaps.topGaps.length && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">All Identified Gaps</h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {gaps.allGaps.map((gap, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-lg">
                <span className="text-sm font-medium text-slate-300">{gap.concept}</span>
                <span className="text-xs text-slate-400">
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
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg mb-6 transition glow-indigo-sm"
        >
          {analyzing ? 'Analyzing...' : 'Get AI Analysis & Recommendations'}
        </button>
      )}

      {analysis && (
        <div className="bg-indigo-500/15 p-4 rounded-lg border-l-4 border-indigo-500">
          <h4 className="font-semibold text-indigo-300 mb-2">AI Analysis & Recommendations</h4>
          <div className="text-sm text-slate-300 whitespace-pre-wrap">
            {analysis.analysis}
          </div>
        </div>
      )}
    </div>
  );
}
