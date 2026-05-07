import StudyPlanView from '@/components/StudyPlanView';

export const metadata = {
  title: 'Study Plan - LearnAI',
  description: 'Your personalized study plan'
};

export default function PlanPage({ params }) {
  return (
    <main className="min-h-screen bg-[#050508] p-6">
      <div className="max-w-4xl mx-auto">
        <StudyPlanView planId={params.planId} />
      </div>
    </main>
  );
}
