import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
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
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Creator Tools Hub
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive tools to grow your audience and create better content
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {creatorTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group"
            >
              <div className={`bg-linear-to-br ${tool.color} rounded-lg shadow-lg p-6 text-white transition-transform hover:scale-105 h-full cursor-pointer`}>
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
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Creator Intelligence Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📈 Analytics</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Confusion detection at specific timestamps</li>
                <li>✓ Viewer retention tracking</li>
                <li>✓ Content gap identification</li>
                <li>✓ AI-powered recommendations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🤖 AI Tools</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Intelligent script generation</li>
                <li>✓ Thumbnail concept creation</li>
                <li>✓ Course structure planning</li>
                <li>✓ Customizable outputs</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🚀 Benefits</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Save time on planning & creation</li>
                <li>✓ Understand viewer behavior</li>
                <li>✓ Improve content quality</li>
                <li>✓ Grow audience faster</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to Grow Your Audience?</h2>
          <p className="text-lg text-white/90 mb-6">
            Start using our Creator Intelligence tools to understand viewers and create better content
          </p>
          <Link
            href="/creator/dashboard"
            className="inline-block bg-white text-indigo-600 font-bold py-3 px-8 rounded-lg hover:bg-white/90 transition-all"
          >
            Launch Creator Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
