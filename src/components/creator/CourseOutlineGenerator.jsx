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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">AI Course Outline Generator</h2>

      <form onSubmit={handleGenerateOutline} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Subject
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="e.g., Web Development with React"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Level
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Modules
            </label>
            <input
              type="number"
              name="numModules"
              value={formData.numModules}
              onChange={handleInputChange}
              min="1"
              max="20"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience (optional)
          </label>
          <input
            type="text"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleInputChange}
            placeholder="e.g., Students, Professionals, Career Changers"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Objectives (optional)
          </label>
          <textarea
            name="objectives"
            value={formData.objectives}
            onChange={handleInputChange}
            placeholder="Enter learning objectives separated by commas"
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !formData.subject}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition"
        >
          {loading ? 'Generating Outline...' : 'Generate Course Outline'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {outline && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Modules</p>
              <p className="text-2xl font-bold">{outline.moduleCount}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Estimated Hours</p>
              <p className="text-2xl font-bold">{outline.totalEstimatedHours}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-sm text-gray-600">Level</p>
              <p className="text-xl font-bold">{outline.level}</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Course Structure</h3>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {outline.outline.map((module, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded border-l-4 border-blue-500"
                >
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Module {module.moduleNumber}
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {module.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownloadOutline}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition"
          >
            Download Course Outline
          </button>
        </div>
      )}
    </div>
  );
}
