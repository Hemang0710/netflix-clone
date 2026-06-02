import { verifyAuth } from '@/lib/auth';
import { CreatorDashboard } from '@/components/creator';
import Navbar from '@/components/layout/Navbar';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Creator Intelligence Hub - Dashboard',
  description: 'Analytics and AI tools for content creators to improve video quality',
};

export default async function CreatorDashboardPage({ searchParams }) {
  try {
    const user = await verifyAuth();
  } catch (error) {
    redirect('/login');
  }

  // Use uploaded video ID if provided, otherwise use demo
  const { videoId } = searchParams || {};
  const contentId = videoId || process.env.DEMO_CONTENT_ID || 'demo-content';

  return (
    <>
      <Navbar />
      <main>
        <CreatorDashboard contentId={contentId} />
      </main>
    </>
  );
}
