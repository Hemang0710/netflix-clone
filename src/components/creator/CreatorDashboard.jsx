'use client';

import { useState, useEffect } from 'react';
import ConfusionHeatmap from './ConfusionHeatmap';
import DropoffAnalytics from './DropoffAnalytics';
import ContentGapDetector from './ContentGapDetector';
import ScriptWriter from './ScriptWriter';
import ThumbnailGenerator from './ThumbnailGenerator';
import CourseOutlineGenerator from './CourseOutlineGenerator';

const TAB_SECTIONS = {
  ANALYTICS: 'analytics',
  AI_TOOLS: 'ai_tools',
};

export default function CreatorDashboard({ contentId }) {
  const [activeSection, setActiveSection] = useState(TAB_SECTIONS.ANALYTICS);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === 'analytics' || hash === 'ai_tools') {
      setActiveSection(hash);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Creator Intelligence Hub
          </h1>
          <p className="text-gray-600">
            Solve Content Quality Gaps with AI-Powered Analytics & Tools
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveSection(TAB_SECTIONS.ANALYTICS)}
                className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                  activeSection === TAB_SECTIONS.ANALYTICS
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                📊 Analytics & Insights
              </button>
              <button
                onClick={() => setActiveSection(TAB_SECTIONS.AI_TOOLS)}
                className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                  activeSection === TAB_SECTIONS.AI_TOOLS
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                ✨ AI Creation Tools
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeSection === TAB_SECTIONS.ANALYTICS && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">
                    Content Performance Analytics
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ConfusionHeatmap contentId={contentId} />
                    <DropoffAnalytics contentId={contentId} />
                  </div>
                </div>

                <ContentGapDetector contentId={contentId} />
              </div>
            )}

            {activeSection === TAB_SECTIONS.AI_TOOLS && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">
                    AI-Powered Creation Tools
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ScriptWriter />
                    <ThumbnailGenerator />
                  </div>
                </div>

                <CourseOutlineGenerator />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Creator Intelligence Features</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <li>✅ Confusion Heatmap - Identify viewer confusion points</li>
            <li>✅ Dropoff Analytics - Analyze viewer retention rates</li>
            <li>✅ Content Gap Detector - Find missing explanations</li>
            <li>✅ AI Script Writer - Generate engaging video scripts</li>
            <li>✅ AI Thumbnail Generator - Create professional thumbnails</li>
            <li>✅ AI Course Outline - Structure complete courses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
