"use client";

import { useState, useEffect } from "react";

export default function AdminBadgesPage() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    contentId: "",
    name: "",
    description: "",
    icon: "🏆",
    criteria: {
      minQuizScore: 85,
      minFlashcardReps: 50,
      minTimeSpent: 600,
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch available content
    fetch("/api/content")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setContents(data.data || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✓ Badge created successfully");
        setFormData({
          contentId: "",
          name: "",
          description: "",
          icon: "🏆",
          criteria: {
            minQuizScore: 85,
            minFlashcardReps: 50,
            minTimeSpent: 600,
          },
        });
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-white p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-8">Create Badge</h1>

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.startsWith("✓")
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">Content</label>
            <select
              value={formData.contentId}
              onChange={(e) =>
                setFormData({ ...formData, contentId: e.target.value })
              }
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a content...</option>
              {contents.map((content) => (
                <option key={content.id} value={content.id}>
                  {content.title}
                </option>
              ))}
            </select>
          </div>

          {/* Badge Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Badge Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Python Decorators Master"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
          </div>

          {/* Badge Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what this badge represents..."
              required
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Badge Icon */}
          <div>
            <label className="block text-sm font-semibold mb-2">Icon</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              placeholder="Emoji or SVG"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Preview: <span className="text-2xl">{formData.icon}</span>
            </p>
          </div>

          {/* Criteria */}
          <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg">
            <h3 className="font-semibold">Criteria</h3>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Min Quiz Score (%)
              </label>
              <input
                type="number"
                value={formData.criteria.minQuizScore}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    criteria: {
                      ...formData.criteria,
                      minQuizScore: Number(e.target.value),
                    },
                  })
                }
                min="0"
                max="100"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Min Flashcard Reps
              </label>
              <input
                type="number"
                value={formData.criteria.minFlashcardReps}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    criteria: {
                      ...formData.criteria,
                      minFlashcardReps: Number(e.target.value),
                    },
                  })
                }
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Min Time Spent (seconds)
              </label>
              <input
                type="number"
                value={formData.criteria.minTimeSpent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    criteria: {
                      ...formData.criteria,
                      minTimeSpent: Number(e.target.value),
                    },
                  })
                }
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {submitting ? "Creating..." : "Create Badge"}
          </button>
        </form>
      </div>
    </div>
  );
}
