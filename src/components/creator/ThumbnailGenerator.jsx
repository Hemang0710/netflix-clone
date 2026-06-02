'use client';

import { useState } from 'react';

export default function ThumbnailGenerator() {
  const [formData, setFormData] = useState({
    title: '',
    mood: 'professional',
    style: 'modern',
    colors: '',
    elements: '',
    generateImage: false,
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGenerateThumbnail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/creator/ai/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to generate thumbnail');
      const data = await res.json();
      setThumbnail(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(thumbnail.dallePrompt);
    alert('DALL-E prompt copied to clipboard!');
  };

  return (
    <div className="glass-card rounded-2xl shadow-md p-6 border border-white/10">
      <h2 className="text-2xl font-bold mb-6 text-white">AI Thumbnail Generator</h2>

      <form onSubmit={handleGenerateThumbnail} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Video Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., 5 Ways to Improve Your Coding Skills"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Mood
            </label>
            <select
              name="mood"
              value={formData.mood}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="professional">Professional</option>
              <option value="energetic">Energetic</option>
              <option value="calm">Calm</option>
              <option value="mysterious">Mysterious</option>
              <option value="playful">Playful</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Style
            </label>
            <select
              name="style"
              value={formData.style}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="modern">Modern</option>
              <option value="retro">Retro</option>
              <option value="minimalist">Minimalist</option>
              <option value="colorful">Colorful</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Preferred Colors (optional)
          </label>
          <input
            type="text"
            name="colors"
            value={formData.colors}
            onChange={handleInputChange}
            placeholder="e.g., Blue, Orange, White"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Key Elements (optional)
          </label>
          <input
            type="text"
            name="elements"
            value={formData.elements}
            onChange={handleInputChange}
            placeholder="e.g., Code, Charts, People"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="generateImage"
            name="generateImage"
            checked={formData.generateImage}
            onChange={handleInputChange}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <label htmlFor="generateImage" className="text-sm text-slate-300">
            Generate actual image using DALL-E (requires API access)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.title}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition glow-indigo-sm"
        >
          {loading ? 'Generating...' : 'Generate Thumbnail Concept'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/15 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {thumbnail && (
        <div className="space-y-4">
          <div className="bg-indigo-500/15 border-l-4 border-indigo-500 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-300 mb-2">DALL-E Prompt</h3>
            <p className="text-sm text-slate-300 mb-3 p-3 bg-white/5 rounded border border-white/10">
              {thumbnail.dallePrompt}
            </p>
            <button
              onClick={handleCopyPrompt}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1 px-3 rounded text-sm transition"
            >
              Copy Prompt
            </button>
          </div>

          {thumbnail.designSuggestions && (
            <div className="bg-emerald-500/15 border-l-4 border-emerald-500 p-4 rounded-lg">
              <h3 className="font-semibold text-emerald-300 mb-2">Design Suggestions</h3>
              <div className="text-sm text-slate-300 whitespace-pre-wrap">
                {thumbnail.designSuggestions}
              </div>
            </div>
          )}

          {thumbnail.image && (
            <div className="bg-purple-500/15 border-l-4 border-purple-500 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-300 mb-2">Image Generation Status</h3>
              <p className="text-sm text-slate-300">{thumbnail.image.status}</p>
              {thumbnail.image.note && (
                <p className="text-sm text-slate-400 mt-2">{thumbnail.image.note}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
