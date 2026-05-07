import StudyPlanWizard from '@/components/StudyPlanWizard';

export const metadata = {
  title: 'Create Study Plan - LearnAI',
  description: 'Create a personalized study plan tailored to your goals and schedule'
};

export default function CreatePlanPage() {
  return (
    <main className="min-h-screen bg-[#050508]">
      <StudyPlanWizard />
    </main>
  );
}
