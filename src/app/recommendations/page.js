import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import StudyPartnerRecommendations from "@/components/recommendations/StudyPartnerRecommendations";
import CourseRecommendations from "@/components/recommendations/CourseRecommendations";

export const metadata = {
  title: "Recommendations",
  description: "Get personalized study partners and course recommendations",
};

export default async function RecommendationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#050508]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Personalized <span className="gradient-text">Recommendations</span>
          </h1>
          <p className="text-xl text-slate-400">
            Find study partners and courses tailored to your learning journey
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Study Partners */}
          <section className="rounded-2xl bg-white/5 border border-white/10 p-8">
            <h2 className="text-2xl font-black mb-6">👥 Study Partners</h2>
            <StudyPartnerRecommendations />
          </section>

          {/* Courses */}
          <section className="rounded-2xl bg-white/5 border border-white/10 p-8">
            <h2 className="text-2xl font-black mb-6">📚 Recommended Courses</h2>
            <CourseRecommendations />
          </section>
        </div>

        {/* Tips Section */}
        <section className="mt-12 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-8">
          <h3 className="text-xl font-bold mb-4">💡 Tips for Learning Together</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TipCard
              icon="🎯"
              title="Set Clear Goals"
              description="Agree on what you want to learn together and set weekly milestones"
            />
            <TipCard
              icon="🗓️"
              title="Schedule Sessions"
              description="Regular study sessions build consistency and accountability"
            />
            <TipCard
              icon="🏆"
              title="Challenge Each Other"
              description="Quiz challenges make learning fun and keep motivation high"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function TipCard({ icon, title, description }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-6">
      <span className="text-3xl mb-3 block">{icon}</span>
      <h4 className="font-bold text-white mb-2">{title}</h4>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}
