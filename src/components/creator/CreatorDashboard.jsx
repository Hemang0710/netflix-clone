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
    <div className="min-h-screen bg-[#050508] py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            Creator Intelligence Hub
          </h1>
          <p className="text-slate-400 text-lg">
            Solve Content Quality Gaps with AI-Powered Analytics & Tools
          </p>
        </div>

        <div className="glass-card rounded-2xl shadow-lg border border-white/10">
          <div className="border-b border-white/10">
            <div className="flex">
              <button
                onClick={() => setActiveSection(TAB_SECTIONS.ANALYTICS)}
                className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                  activeSection === TAB_SECTIONS.ANALYTICS
                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 Analytics & Insights
              </button>
              <button
                onClick={() => setActiveSection(TAB_SECTIONS.AI_TOOLS)}
                className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                  activeSection === TAB_SECTIONS.AI_TOOLS
                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white'
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
                  <h2 className="text-2xl font-bold mb-6 text-white">
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
                  <h2 className="text-2xl font-bold mb-6 text-white">
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

        <div className="mt-8 bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white border border-indigo-500/20">
          <h3 className="text-xl font-bold mb-4">Creator Intelligence Features</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/90">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✅</span>
              <span>Confusion Heatmap - Identify viewer confusion points</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✅</span>
              <span>Dropoff Analytics - Analyze viewer retention rates</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✅</span>
              <span>Content Gap Detector - Find missing explanations</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✅</span>
              <span>AI Script Writer - Generate engaging video scripts</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✅</span>
              <span>AI Thumbnail Generator - Create professional thumbnails</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✅</span>
              <span>AI Course Outline - Structure complete courses</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
