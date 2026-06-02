import { useState } from "react";
import { motion } from "motion/react";
import CreateGoalModal from "./CreateGoalModal";

export default function GoalsTracker({ goals = [], compact = false }) {
  const [showCreate, setShowCreate] = useState(false);

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Learning Goals</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl transition-all text-sm"
        >
          + New Goal
        </button>
      </div>

      {/* Active Goals */}
      {active.length > 0 && (
        <div className={compact ? "" : "glass-card rounded-2xl p-8 border border-white/10"}>
          <h3 className="text-lg font-bold mb-4">Active Goals</h3>
          <div className="space-y-4">
            {active.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completed.length > 0 && (
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-lg font-bold mb-4">Completed Goals</h3>
          <div className="space-y-2">
            {completed.slice(0, compact ? 3 : 10).map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-emerald-400 text-xl">✓</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{goal.title}</p>
                  <p className="text-xs text-slate-500">
                    {goal.target} {goal.unit} • {goal.period}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {active.length === 0 && completed.length === 0 && (
        <div className="glass-card rounded-2xl p-12 border border-white/10 text-center">
          <p className="text-slate-400 mb-4">No goals yet. Create one to get started!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl transition-all text-sm inline-block"
          >
            Create Your First Goal
          </button>
        </div>
      )}

      <CreateGoalModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function GoalCard({ goal }) {
  const progressPercent = goal.progressPercent || 0;
  const isCompleted = goal.isCompleted || false;

  const deadlineDays = Math.ceil(
    (new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-bold text-white mb-1">{goal.title}</h4>
          {goal.description && (
            <p className="text-sm text-slate-400">{goal.description}</p>
          )}
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          isCompleted
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-indigo-500/20 text-indigo-400"
        }`}>
          {goal.category}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-400">
            <span className="font-bold text-white">{goal.currentProgress}</span>
            {" / "}
            {goal.target} {goal.unit}
          </p>
          <p className="text-sm font-semibold">
            {Math.round(progressPercent)}%
          </p>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              isCompleted
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-indigo-500 to-violet-500"
            }`}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{goal.period}</span>
        <span>
          {deadlineDays > 0
            ? `${deadlineDays} days left`
            : "Ended"}
        </span>
      </div>
    </motion.div>
  );
}
