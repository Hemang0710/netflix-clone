"use client";

import { useState } from "react";

export default function MicroLessonManager({ contentId, hasTranscript }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lessonCount, setLessonCount] = useState(0);

  async function handleGenerateMicroLessons() {
    if (!hasTranscript) {
      setError("Transcript not available. Please ensure transcript is processed.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(
        `/api/content/${contentId}/micro-lessons/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to generate micro-lessons");
        return;
      }

      setLessonCount(data.data.count);
      setSuccess(true);

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-black text-white mb-2">
              Auto-Generate Micro-Lessons
            </h3>
            <p className="text-sm text-slate-400">
              Split your video into bite-sized 2-5 minute lessons for better retention and mobile learning.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-sm text-emerald-400">
                ✓ Generated {lessonCount} micro-lessons successfully!
              </p>
            </div>
          )}

          {!hasTranscript && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-sm text-yellow-400">
                ⚠ Transcript not available. Please wait for transcript processing to complete.
              </p>
            </div>
          )}

          <button
            onClick={handleGenerateMicroLessons}
            disabled={loading || !hasTranscript}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-slate-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? "Generating..." : "Generate Micro-Lessons"}
          </button>

          <p className="text-xs text-slate-500">
            💡 Micro-lessons are auto-generated from your video's transcript and will appear to learners on the watch page.
          </p>
        </div>
      </div>
    </div>
  );
}
