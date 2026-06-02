import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AnalyticsDashboard({ data }) {
  // Prepare genre trends data
  const genreChartData = (data.genreTrends || []).map((g) => ({
    name: g.genre || "Unknown",
    score: Math.round(g.avg_score) || 0,
    attempts: g.attempts || 0,
  }));

  const COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
    "#f97316",
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-6 border border-white/10">
          <p className="text-slate-400 text-sm mb-2">Avg Quiz Score</p>
          <p className="text-4xl font-black gradient-text">
            {data.summary.avgQuizScore}%
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {data.quizAttempts?.length || 0} quizzes taken
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 border border-white/10">
          <p className="text-slate-400 text-sm mb-2">Concept Mastery</p>
          <p className="text-4xl font-black gradient-text">
            {data.summary.conceptMasteryScore}%
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {data.conceptMasteries?.length || 0} concepts tracked
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 border border-white/10">
          <p className="text-slate-400 text-sm mb-2">Learning Time</p>
          <p className="text-4xl font-black gradient-text">
            {data.summary.totalMinutesWatched}{" "}
            <span className="text-lg">min</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Current streak: {data.summary.currentStreak}d
          </p>
        </div>
      </div>

      {/* Performance by Subject */}
      {genreChartData.length > 0 && (
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold mb-6">Performance by Subject</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={genreChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(5, 5, 8, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.5rem",
                }}
              />
              <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Performing Areas */}
      <div className="glass-card rounded-2xl p-8 border border-white/10">
        <h3 className="text-xl font-bold mb-6">Top Performing Areas</h3>
        <div className="space-y-3">
          {genreChartData
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.attempts} quizzes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black gradient-text">{item.score}%</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Quiz Attempts */}
      {data.quizAttempts?.length > 0 && (
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold mb-6">Recent Quiz Results</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.quizAttempts.slice(0, 10).map((attempt, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{attempt.content?.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(attempt.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${attempt.score >= 80 ? "text-emerald-400" : attempt.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                    {attempt.score}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
