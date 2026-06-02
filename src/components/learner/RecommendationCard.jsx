export default function RecommendationCard({ recommendation }) {
  const priorityColors = {
    high: "text-red-400 bg-red-500/10 border-red-500/20",
    medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    low: "text-green-400 bg-green-500/10 border-green-500/20",
  };

  const icons = {
    review: "📖",
    practice: "✏️",
    new_topic: "🚀",
  };

  return (
    <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
      <div className="flex items-start gap-4">
        <span className="text-3xl">{icons[recommendation.type] || "💡"}</span>
        <div className="flex-1">
          <h4 className="font-bold mb-1">{recommendation.title}</h4>
          <p className="text-sm text-slate-400 mb-3">{recommendation.description}</p>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${priorityColors[recommendation.priority] || priorityColors.low}`}>
              {recommendation.priority?.toUpperCase()}
            </span>
            <span className="text-xs text-slate-500">
              {recommendation.estimatedTime} mins
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
