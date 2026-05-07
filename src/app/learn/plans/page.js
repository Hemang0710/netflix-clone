'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch('/api/study-plans');
        const data = await res.json();

        if (!data.success) {
          setError(data.message);
          setLoading(false);
          return;
        }

        setPlans(data.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050508] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-white/5 rounded-xl" />
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050508] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white">Study Plans</h1>
            <p className="text-slate-500 mt-2">Manage your learning schedules</p>
          </div>
          <Link
            href="/learn/plan/create"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            + New Plan
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mb-6">
            {error}
          </div>
        )}

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-slate-500 mb-4">No study plans yet</p>
            <Link
              href="/learn/plan/create"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Create Your First Plan
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {plans.map(plan => {
              const completedTasks = plan.tasks?.filter(t => t.completed).length || 0;
              const totalTasks = plan.tasks?.length || 0;
              const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <Link
                  key={plan.id}
                  href={`/learn/plan/${plan.id}`}
                  className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {plan.hoursPerWeek}h/week • {plan.goal}
                        </h3>
                        {plan.isActive && (
                          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
                        )}
                      </div>
                      {plan.targetCareer && (
                        <p className="text-sm text-slate-500">{plan.targetCareer}</p>
                      )}
                      <div className="mt-3 space-y-1">
                        <div className="w-24 bg-white/5 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-1.5 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600">
                          {completedTasks}/{totalTasks} tasks • {progressPercent}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
