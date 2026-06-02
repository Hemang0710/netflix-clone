import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Creator Tools - Stream AI',
  description: 'Access all creator intelligence tools and analytics',
};

export default async function CreatorPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const creatorTools = [
    {
      title: '📊 Analytics Hub',
      description: 'Analyze viewer behavior with confusion heatmaps and dropoff analytics',
      href: '/creator/dashboard#analytics',
      color: 'from-blue-500 to-cyan-500',
      features: ['Confusion Heatmap', 'Dropoff Analytics', 'Content Gap Detection'],
    },
    {
      title: '✨ AI Creation Tools',
      description: 'Generate scripts, thumbnails, and course outlines with AI',
      href: '/creator/dashboard#ai_tools',
      color: 'from-purple-500 to-pink-500',
      features: ['Script Writer', 'Thumbnail Generator', 'Course Outline Generator'],
    },
    {
      title: '📹 Video Studio',
      description: 'Upload and manage your video content',
      href: '/creator/studio',
      color: 'from-orange-500 to-red-500',
      features: ['Upload Videos', 'Manage Content', 'Track Progress'],
    },
    {
      title: '🎯 Learning Paths',
      description: 'Create structured learning experiences for your audience',
      href: '/creator/paths',
      color: 'from-green-500 to-teal-500',
      features: ['Create Paths', 'Organize Content', 'Manage Access'],
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#050508]">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          {/* Header Section */}
          <div className="relative py-12 border-b border-white/10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-sm font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Creator Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              Creator Tools Hub
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              Comprehensive tools to grow your audience and create better content
            </p>
          </div>

          {/* Tools Grid */}
          <div className="py-16 grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 border-b border-white/10">
            {creatorTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group"
              >
                <div className={`bg-linear-to-br ${tool.color} rounded-2xl shadow-lg p-6 text-white transition-all hover:scale-105 h-full cursor-pointer border border-white/10`}>
                  <h2 className="text-2xl font-bold mb-2">{tool.title}</h2>
                  <p className="text-white/90 mb-4">{tool.description}</p>
                  <div className="space-y-2">
                    {tool.features.map((feature, idx) => (
                      <div key={idx} className="text-sm text-white/80 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                    Get Started →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="py-16 border-b border-white/10">
            <h2 className="text-3xl font-bold text-white mb-8">Creator Intelligence Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">📈 Analytics</h3>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-1">✓</span>
                    <span>Confusion detection at specific timestamps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-1">✓</span>
                    <span>Viewer retention tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-1">✓</span>
                    <span>Content gap identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-1">✓</span>
                    <span>AI-powered recommendations</span>
                  </li>
                </ul>
              </div>
              <div className="glass-card rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">🤖 AI Tools</h3>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span>Intelligent script generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span>Thumbnail concept creation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span>Course structure planning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span>Customizable outputs</span>
                  </li>
                </ul>
              </div>
              <div className="glass-card rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">🚀 Benefits</h3>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Save time on planning & creation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Understand viewer behavior</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Improve content quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>Grow audience faster</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="py-16">
            <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 md:p-12 text-white text-center border border-indigo-500/20">
              <h2 className="text-3xl md:text-4xl font-black mb-3">Ready to Grow Your Audience?</h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Start using our Creator Intelligence tools to understand viewers and create better content
              </p>
              <Link
                href="/creator/dashboard"
                className="inline-block bg-white text-indigo-600 font-bold py-3 px-8 rounded-xl hover:bg-white/90 transition-all glow-indigo-sm"
              >
                Launch Creator Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
