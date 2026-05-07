"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function MicroLessonPlayer({
  contentId,
  microLessons,
  videoUrl,
  contentTitle,
}) {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  const lesson = microLessons?.[currentLesson];

  if (!lesson) {
    return (
      <div className="text-center py-12 text-slate-400">
        No micro-lessons available yet
      </div>
    );
  }

  // Load progress for current lesson
  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch(
          `/api/content/${contentId}/micro-lessons/${lesson.id}/progress`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setProgress(data.data);
        }
      } catch (error) {
        console.error("Error loading progress:", error);
      }
    }

    loadProgress();
  }, [contentId, lesson.id]);

  // Auto-seek to lesson timestamps
  useEffect(() => {
    if (videoRef.current && lesson) {
      videoRef.current.currentTime = lesson.startTimestamp;
    }
  }, [currentLesson, lesson]);

  // Auto-advance when lesson ends
  const handleTimeUpdate = () => {
    if (
      videoRef.current &&
      lesson &&
      videoRef.current.currentTime >= lesson.endTimestamp
    ) {
      if (currentLesson < microLessons.length - 1) {
        markWatched();
        setCurrentLesson(currentLesson + 1);
      }
    }
  };

  async function markWatched() {
    if (loading) return;
    setLoading(true);

    try {
      await fetch(
        `/api/content/${contentId}/micro-lessons/${lesson.id}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watched: true }),
        }
      );

      setProgress((prev) => ({ ...prev, watched: true, watchedAt: new Date() }));
    } catch (error) {
      console.error("Error marking as watched:", error);
    } finally {
      setLoading(false);
    }
  }

  function goToNext() {
    if (currentLesson < microLessons.length - 1) {
      markWatched();
      setCurrentLesson(currentLesson + 1);
    }
  }

  function goToPrevious() {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    }
  }

  const watchedCount = microLessons.filter((ml, idx) => {
    // This is a simplified check - ideally we'd load all progress data
    return progress.watched && idx === currentLesson;
  }).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Player */}
      <div className="lg:col-span-2 space-y-4">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full"
          />
        </div>

        {/* Lesson Info */}
        <div className="space-y-3 bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white">{lesson.title}</h2>
              <p className="text-slate-400 mt-1">{lesson.description}</p>
              <div className="flex gap-4 mt-3 text-sm text-slate-500">
                <span>
                  Part {currentLesson + 1} of {microLessons.length}
                </span>
                <span>•</span>
                <span>{lesson.duration}s</span>
                {lesson.concept && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-400">{lesson.concept}</span>
                  </>
                )}
              </div>
            </div>

            {progress.watched && (
              <div className="text-2xl">✓</div>
            )}
          </div>

          {lesson.transcriptSegment && (
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-xs font-semibold text-slate-400 mb-2">
                Transcript Excerpt
              </p>
              <p className="text-sm text-slate-300 line-clamp-3">
                {lesson.transcriptSegment}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={goToPrevious}
            disabled={currentLesson === 0}
            className="flex-1 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:text-slate-600 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            ← Previous
          </button>

          <button
            onClick={markWatched}
            disabled={progress.watched || loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-emerald-600 disabled:text-white text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {loading ? "…" : progress.watched ? "✓ Watched" : "Mark Watched"}
          </button>

          <button
            onClick={goToNext}
            disabled={currentLesson === microLessons.length - 1}
            className="flex-1 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:text-slate-600 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-slate-400">
              Course Progress
            </p>
            <p className="text-xs text-slate-500">
              {Math.round(((currentLesson + 1) / microLessons.length) * 100)}%
            </p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{
                width: `${((currentLesson + 1) / microLessons.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Lesson List Sidebar */}
      <div className="space-y-3">
        <h3 className="font-black text-white text-lg">Course: Micro-Lessons</h3>
        <p className="text-xs text-slate-500">{contentTitle}</p>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {microLessons.map((ml, idx) => (
            <button
              key={ml.id}
              onClick={() => setCurrentLesson(idx)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                idx === currentLesson
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-white/8 hover:border-white/20 bg-white/5"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="shrink-0 mt-0.5">
                  {progress.watched ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-slate-600">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {ml.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ml.duration}s {ml.concept && `• ${ml.concept}`}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="border-t border-white/10 pt-3 mt-4">
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total Duration</span>
              <span className="text-white font-semibold">
                {Math.round(microLessons.reduce((sum, ml) => sum + ml.duration, 0) / 60)} min
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Lessons</span>
              <span className="text-white font-semibold">
                {microLessons.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
