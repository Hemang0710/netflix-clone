"use client";

import { useOfflineStorage } from "@/hooks/useOfflineStorage";

/**
 * Example: Using offline storage for watch progress
 *
 * This component demonstrates how to track video progress
 * and automatically sync when back online
 */
export function WatchProgressTracker({ videoId }) {
  const [progress, setProgress, isOnline, isLoading] = useOfflineStorage(
    `watch_progress_${videoId}`,
    {
      videoId,
      timestamp: 0,
      duration: 0,
      completed: false,
      savedAt: null
    }
  );

  const handleTimeUpdate = (currentTime, duration) => {
    setProgress({
      ...progress,
      timestamp: currentTime,
      duration: duration,
      completed: currentTime / duration > 0.9, // 90% watched = completed
      savedAt: new Date().toISOString()
    });
  };

  if (isLoading) {
    return <div className="text-slate-500">Loading progress...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-yellow-500"}`} />
        <span className="text-slate-400">
          {isOnline ? "Online - Changes syncing" : "Offline - Will sync when online"}
        </span>
      </div>

      {/* Progress display */}
      {progress.duration > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Watch Progress</span>
            <span>
              {formatTime(progress.timestamp)} / {formatTime(progress.duration)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${(progress.timestamp / progress.duration) * 100}%` }}
            />
          </div>

          {/* Completion status */}
          {progress.completed && (
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              ✓ Video completed
            </div>
          )}
        </div>
      )}

      {/* Last saved indicator */}
      {progress.savedAt && (
        <div className="text-xs text-slate-600">
          Last saved: {formatTime(new Date(progress.savedAt).getTime() / 1000)}
        </div>
      )}
    </div>
  );
}

/**
 * Example: Using offline storage for quiz responses
 */
export function QuizResponseTracker({ contentId, attemptId }) {
  const [responses, setResponses, isOnline] = useOfflineStorage(
    `quiz_attempt_${attemptId}`,
    {
      attemptId,
      contentId,
      answers: {},
      startedAt: new Date().toISOString(),
      submittedAt: null,
      synced: false
    }
  );

  const handleAnswer = (questionId, answer) => {
    setResponses({
      ...responses,
      answers: {
        ...responses.answers,
        [questionId]: answer
      }
    });
  };

  const handleSubmit = async () => {
    const updated = {
      ...responses,
      submittedAt: new Date().toISOString()
    };
    setResponses(updated);

    // If online, submit immediately
    if (isOnline) {
      // Would call API here
      console.log("[Quiz] Submitting:", updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-400">
        {Object.keys(responses.answers).length} answers saved
        {!isOnline && " (offline)"}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg"
      >
        {isOnline ? "Submit Quiz" : "Submit When Online"}
      </button>
    </div>
  );
}

/**
 * Example: Using offline storage for notes
 */
export function NotesEditor({ contentId }) {
  const [notes, setNotes, isOnline, isLoading] = useOfflineStorage(
    `notes_${contentId}`,
    {
      contentId,
      text: "",
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );

  const handleTextChange = (text) => {
    setNotes({
      ...notes,
      text,
      updatedAt: new Date().toISOString()
    });
  };

  if (isLoading) return <div>Loading notes...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">My Notes</label>
        <span className="text-xs text-slate-500">
          {isOnline ? "✓ Auto-saving" : "📱 Offline"}
        </span>
      </div>

      <textarea
        value={notes.text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Add your notes here..."
        className="w-full h-32 bg-white/5 border border-white/8 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="text-xs text-slate-600">
        Last updated: {formatTime(new Date(notes.updatedAt).getTime() / 1000)}
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(seconds) {
  if (!seconds || seconds < 0) return "0:00";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
