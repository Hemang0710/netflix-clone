'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudyPlanWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    hoursPerWeek: 10,
    goal: 'certify',
    targetCareer: '',
    preferences: {
      preferMorning: true,
      preferMobileTime: false,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/study-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to create plan');
        setLoading(false);
        return;
      }

      router.push(`/learn/plan/${data.data.planId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-12">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                step >= s ? 'bg-indigo-600' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Hours per week */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black">How much time can you study per week?</h2>
              <p className="text-slate-400">Choose the amount of time you can realistically dedicate</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[5, 10, 20, 30].map(hours => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setForm({ ...form, hoursPerWeek: hours })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      form.hoursPerWeek === hours
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/8 hover:border-white/20'
                    }`}
                  >
                    <p className="text-2xl font-black">{hours}h</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {Math.ceil(hours / 5)} sessions
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black">What's your learning goal?</h2>
              <p className="text-slate-400">This helps us personalize your schedule</p>
              <div className="space-y-3">
                {[
                  { value: 'hobby', label: 'Hobby/Interest', desc: 'Learn for fun and personal growth' },
                  { value: 'certify', label: 'Certification', desc: 'Earn a verified credential' },
                  { value: 'career_switch', label: 'Career Switch', desc: 'New job within 3-6 months' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, goal: option.value })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      form.goal === option.value
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/8 hover:border-white/20'
                    }`}
                  >
                    <p className="font-bold">{option.label}</p>
                    <p className="text-sm text-slate-500">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Career (optional) */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black">Target career (optional)</h2>
              <p className="text-slate-400">Help us optimize your learning path</p>
              <input
                type="text"
                placeholder="e.g., Data Scientist, Web Developer, Product Manager"
                value={form.targetCareer}
                onChange={e => setForm({ ...form, targetCareer: e.target.value })}
                className="w-full bg-white/5 border border-white/8 text-white placeholder-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="morning"
                  checked={form.preferences.preferMorning}
                  onChange={e =>
                    setForm({
                      ...form,
                      preferences: { ...form.preferences, preferMorning: e.target.checked }
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="morning" className="text-sm text-slate-400">
                  I prefer learning in the morning
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="mobile"
                  checked={form.preferences.preferMobileTime}
                  onChange={e =>
                    setForm({
                      ...form,
                      preferences: { ...form.preferences, preferMobileTime: e.target.checked }
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="mobile" className="text-sm text-slate-400">
                  Include quick mobile-friendly lessons
                </label>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex-1 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {loading ? 'Creating your plan...' : 'Create Plan'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
