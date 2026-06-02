import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export default function SubjectBreakdown({ data }) {
  const subjects = data.subjects || [];

  const chartData = subjects
    .map((s) => ({
      name: s.subject,
      mastery: s.avgMastery,
      completion: s.completionRate,
      timeSpent: Math.round(s.minutesSpent / 60),
    }))
    .slice(0, 8);

  const masteryRadarData = subjects
    .map((s) => ({
      subject: s.subject,
      mastery: s.avgMastery,
    }))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-6 border border-white/10">
          <p className="text-slate-400 text-sm mb-2">Strongest Subject</p>
          <p className="text-xl font-bold text-emerald-400">
            {data.summary?.strongestSubject || "N/A"}
          </p>
        </div>
        <div className="glass-card rounded-xl p-6 border border-white/10">
          <p className="text-slate-400 text-sm mb-2">Avg Completion</p>
          <p className="text-xl font-bold text-indigo-400">
            {data.summary?.averageCompletionRate || 0}%
          </p>
        </div>
        <div className="glass-card rounded-xl p-6 border border-white/10">
          <p className="text-slate-400 text-sm mb-2">Total Subjects</p>
          <p className="text-xl font-bold text-violet-400">
            {data.summary?.totalSubjects || 0}
          </p>
        </div>
      </div>

      {/* Mastery Comparison */}
      {chartData.length > 0 && (
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold mb-6">Subject Mastery Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(5, 5, 8, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <Bar dataKey="mastery" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subject Details */}
      <div className="glass-card rounded-2xl p-8 border border-white/10">
        <h3 className="text-xl font-bold mb-6">Subject Progress</h3>
        <div className="space-y-4">
          {subjects.map((subject, i) => (
            <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold">{subject.subject}</h4>
                  <p className="text-xs text-slate-500">{subject.strengthLevel}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{subject.avgMastery}%</p>
                  <p className="text-xs text-slate-500">{subject.conceptsMastered}/{subject.conceptsLearned} concepts</p>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Mastery</span>
                    <span>{subject.avgMastery}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      style={{ width: `${subject.avgMastery}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Completion</span>
                    <span>{subject.completionRate}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${subject.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
                <div>📹 {subject.videosWatched} watched</div>
                <div>🧪 {subject.quizzesTaken} quizzes</div>
                <div>⏱️ {Math.round(subject.minutesSpent / 60)}h</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
