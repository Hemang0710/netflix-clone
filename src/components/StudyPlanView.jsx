'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StudyPlanView({ planId }) {
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch(`/api/study-plans/${planId}`);
        const data = await res.json();

        if (!data.success) {
          setError(data.message);
          setLoading(false);
          return;
        }

        setPlan(data.data);
        setTasks(data.data.tasks || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadPlan();
  }, [planId]);

  async function completeTask(taskId) {
    setCompletingTask(taskId);

    try {
      const res = await fetch(`/api/study-plans/${planId}/tasks/${taskId}/complete`, {
        method: 'POST'
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setCompletingTask(null);
        return;
      }

      // Update local state
      setTasks(
        tasks.map(t =>
          t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
        )
      );

      setCompletingTask(null);

      // Show behind schedule warning if applicable
      if (data.stats?.behindSchedule) {
        alert(
          'You\'re falling behind schedule! Your plan has been adjusted to help you catch up.'
        );
      }
    } catch (err) {
      setError(err.message);
      setCompletingTask(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-white/5 rounded-xl" />
        <div className="animate-pulse h-96 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  if (!plan) {
    return <div className="text-slate-400">Plan not found</div>;
  }

  // Group tasks by day
  const tasksByDay = {};
  tasks.forEach(task => {
    const date = new Date(task.scheduledFor);
    const day = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!tasksByDay[day]) tasksByDay[day] = [];
    tasksByDay[day].push(task);
  });

  // Calculate progress
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-black text-white">Your Study Plan</h1>
          <p className="text-slate-500 mt-2">
            {plan.hoursPerWeek} hours/week • {plan.goal} •{' '}
            {plan.targetCareer ? `${plan.targetCareer} track` : 'Self-paced'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-indigo-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>{completedCount} completed</span>
            <span>{tasks.length - completedCount} remaining</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Schedule by day */}
      <div className="space-y-4">
        {Object.entries(tasksByDay).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No tasks scheduled yet</p>
          </div>
        ) : (
          Object.entries(tasksByDay).map(([day, dayTasks]) => (
            <div key={day} className="glass-card rounded-2xl p-6 space-y-3 border border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">{day}</h3>
                <span className="text-xs text-slate-600">
                  {dayTasks.filter(t => t.completed).length}/{dayTasks.length} done
                </span>
              </div>

              <div className="space-y-2">
                {dayTasks
                  .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
                  .map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={completeTask}
                      isCompleting={completingTask === task.id}
                    />
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 border border-white/5">
            <p className="text-2xl font-black text-indigo-400">{tasks.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Tasks</p>
          </div>
          <div className="glass-card rounded-xl p-4 border border-white/5">
            <p className="text-2xl font-black text-emerald-400">{completedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Completed</p>
          </div>
          <div className="glass-card rounded-xl p-4 border border-white/5">
            <p className="text-2xl font-black text-blue-400">
              {Math.round((tasks.reduce((sum, t) => sum + t.duration, 0) / 60))}h
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Time</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onComplete, isCompleting }) {
  const scheduledTime = new Date(task.scheduledFor).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const getTaskIcon = type => {
    switch (type) {
      case 'watch_lesson':
        return '▶️';
      case 'quiz':
        return '❓';
      case 'flashcards':
        return '📇';
      case 'review':
        return '🔄';
      default:
        return '📚';
    }
  };

  return (
    <div
      className={`p-3 rounded-lg flex items-center gap-3 transition-all ${
        task.completed
          ? 'bg-emerald-500/10 border border-emerald-500/20'
          : 'bg-white/5 border border-white/8 hover:border-white/15'
      }`}
    >
      <button
        onClick={() => !task.completed && onComplete(task.id)}
        disabled={task.completed || isCompleting}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-white/30 hover:border-indigo-500'
        }`}
      >
        {task.completed && <span className="text-white text-xs">✓</span>}
        {isCompleting && <span className="text-white text-xs animate-spin">⏳</span>}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span>{getTaskIcon(task.taskType)}</span>
          <p className={`text-sm ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
            {task.title}
          </p>
        </div>
        {task.content && (
          <p className="text-xs text-slate-600 mt-1">{task.content.title}</p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 text-right">
        <span className="text-xs text-slate-600">{task.duration}min</span>
        <span className="text-xs text-slate-600 min-w-fit">{scheduledTime}</span>
      </div>
    </div>
  );
}
