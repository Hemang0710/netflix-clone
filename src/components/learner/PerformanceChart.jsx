import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PerformanceChart({ data }) {
  // Prepare quiz attempts data for chart
  const chartData = (data.quizAttempts || [])
    .slice()
    .reverse()
    .slice(-10)
    .map((attempt) => ({
      date: new Date(attempt.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: attempt.score,
      content: attempt.content?.title?.substring(0, 15),
    }));

  const avgScore = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length)
    : 0;

  return (
    <div className="glass-card rounded-2xl p-8 border border-white/10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Quiz Performance Trend</h2>
        <p className="text-slate-400">Last 10 quiz attempts • Average: {avgScore}%</p>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
            <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(5, 5, 8, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: "#6366f1", r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No quiz data yet
        </div>
      )}
    </div>
  );
}
