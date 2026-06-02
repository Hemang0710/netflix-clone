import { useState } from "react";
import { motion } from "motion/react";

const GOAL_TEMPLATES = [
  {
    category: "completion_rate",
    title: "Complete 5 Videos This Week",
    unit: "videos",
    target: 5,
    period: "weekly",
  },
  {
    category: "time_spent",
    title: "Study 10 Hours This Month",
    unit: "hours",
    target: 10,
    period: "monthly",
  },
  {
    category: "quiz_score",
    title: "Achieve 80% Quiz Average",
    unit: "percent",
    target: 80,
    period: "monthly",
  },
  {
    category: "subject",
    title: "Master React Basics",
    unit: "concepts",
    target: 10,
    period: "monthly",
  },
];

export default function CreateGoalModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "completion_rate",
    target: 5,
    unit: "videos",
    period: "weekly",
  });

  const handleCreateFromTemplate = (template) => {
    setFormData(template);
    setStep(2);
  };

  const handleCreate = async () => {
    try {
      const startDate = new Date();
      const endDate = new Date();

      if (formData.period === "weekly") {
        endDate.setDate(endDate.getDate() + 7);
      } else if (formData.period === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const response = await fetch("/api/learner/analytics/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (response.ok) {
        setFormData({
          title: "",
          description: "",
          category: "completion_rate",
          target: 5,
          unit: "videos",
          period: "weekly",
        });
        setStep(0);
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to create goal", error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a0f] border border-white/20 rounded-2xl p-8 w-full max-w-md max-h-96 overflow-y-auto"
      >
        {step === 0 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Create a Learning Goal</h2>
            <div className="space-y-3 mb-6">
              {GOAL_TEMPLATES.map((template, i) => (
                <button
                  key={i}
                  onClick={() => handleCreateFromTemplate(template)}
                  className="w-full p-4 text-left rounded-xl border border-white/10 hover:border-indigo-500/30 hover:bg-white/5 transition-all"
                >
                  <p className="font-semibold">{template.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {template.period.charAt(0).toUpperCase() + template.period.slice(1)} goal
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full py-2 border-t border-white/10 text-indigo-400 hover:text-indigo-300 font-semibold mt-4"
            >
              Custom Goal
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Custom Goal</h2>
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Goal title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                placeholder="Target value"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="hours">Hours</option>
                <option value="videos">Videos</option>
                <option value="percent">Percent</option>
                <option value="concepts">Concepts</option>
              </select>
              <select
                value={formData.period}
                onChange={(e) =>
                  setFormData({ ...formData, period: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold transition"
              >
                Review
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Confirm Goal</h2>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
              <p className="text-sm text-slate-400 mb-1">Goal</p>
              <p className="font-bold text-lg mb-4">{formData.title}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Target</p>
                  <p className="font-semibold">
                    {formData.target} {formData.unit}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Period</p>
                  <p className="font-semibold capitalize">{formData.period}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold transition"
              >
                Create Goal
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
