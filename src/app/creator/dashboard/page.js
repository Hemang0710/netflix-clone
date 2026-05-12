import { verifyAuth } from '@/lib/auth';
import { CreatorDashboard } from '@/components/creator';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Creator Intelligence Hub - Dashboard',
  description: 'Analytics and AI tools for content creators to improve video quality',
};

export default async function CreatorDashboardPage() {
  try {
    const user = await verifyAuth();
  } catch (error) {
    redirect('/login');
  }

  const contentId = process.env.DEMO_CONTENT_ID || 'demo-content';

  return (
    <main>
      <CreatorDashboard contentId={contentId} />
    </main>
  );
}
