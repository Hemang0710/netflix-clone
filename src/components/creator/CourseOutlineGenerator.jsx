'use client';

import { useState } from 'react';

export default function CourseOutlineGenerator() {
  const [formData, setFormData] = useState({
    subject: '',
    level: 'Beginner',
    numModules: 5,
    targetAudience: '',
    objectives: '',
  });
  const [outline, setOutline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numModules' ? parseInt(value) : value,
    }));
  };

  const handleGenerateOutline = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/creator/ai/course-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to generate outline');
      const data = await res.json();
      setOutline(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOutline = () => {
    const content = `# Course: ${outline.subject}
Level: ${outline.level}
Total Modules: ${outline.moduleCount}
Estimated Duration: ${outline.totalEstimatedHours} hours

${outline.outline.map((module) => `## ${module.content}\n`).join('\n')}`;

    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${outline.subject.replace(/\s+/g, '-')}-outline.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="glass-card rounded-2xl shadow-md p-6 border border-white/10">
      <h2 className="text-2xl font-bold mb-6 text-white">AI Course Outline Generator</h2>

      <form onSubmit={handleGenerateOutline} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Course Subject
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="e.g., Web Development with React"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Course Level
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of Modules
            </label>
            <input
              type="number"
              name="numModules"
              value={formData.numModules}
              onChange={handleInputChange}
              min="1"
              max="20"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Target Audience (optional)
          </label>
          <input
            type="text"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleInputChange}
            placeholder="e.g., Students, Professionals, Career Changers"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Learning Objectives (optional)
          </label>
          <textarea
            name="objectives"
            value={formData.objectives}
            onChange={handleInputChange}
            placeholder="Enter learning objectives separated by commas"
            rows="3"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !formData.subject}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition glow-indigo-sm"
        >
          {loading ? 'Generating Outline...' : 'Generate Course Outline'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/15 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {outline && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-500/15 border border-indigo-500/20 p-4 rounded-lg">
              <p className="text-sm text-slate-400">Modules</p>
              <p className="text-2xl font-bold text-white mt-1">{outline.moduleCount}</p>
            </div>
            <div className="bg-emerald-500/15 border border-emerald-500/20 p-4 rounded-lg">
              <p className="text-sm text-slate-400">Estimated Hours</p>
              <p className="text-2xl font-bold text-white mt-1">{outline.totalEstimatedHours}</p>
            </div>
            <div className="bg-purple-500/15 border border-purple-500/20 p-4 rounded-lg">
              <p className="text-sm text-slate-400">Level</p>
              <p className="text-xl font-bold text-white mt-1">{outline.level}</p>
            </div>
          </div>

          <div className="border border-white/10 rounded-lg p-4 bg-white/5">
            <h3 className="text-lg font-semibold mb-4 text-white">Course Structure</h3>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {outline.outline.map((module, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 p-4 rounded-lg border-l-4 border-l-indigo-500"
                >
                  <h4 className="font-semibold text-white mb-2">
                    Module {module.moduleNumber}
                  </h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {module.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownloadOutline}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg transition"
          >
            Download Course Outline
          </button>
        </div>
      )}
    </div>
  );
}
