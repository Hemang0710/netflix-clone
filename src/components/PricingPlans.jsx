"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PLANS } from "@/lib/plans"

export default function PricingPlans({ currentPlan }) {
  const router = useRouter()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState("")

  async function handleSubscribe(plan) {
    setLoading(plan.id)
    setError("")
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, planId: plan.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || "Something went wrong")
        return
      }
      window.location.href = data.url
    } catch {
      setError("Failed to start checkout. Try again.")
    } finally {
      setLoading(null)
    }
  }

  async function handleManage() {
    setLoading("manage")
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(null)
  }

  return (
    <div>
      {error && (
        <p className="text-red-400 mb-6 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id
          const isLoading = loading === plan.id

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 border transition-all ${
                plan.popular
                  ? "border-indigo-500/40 bg-indigo-500/5 scale-105 glow-indigo"
                  : "border-white/8 bg-white/2 hover:border-white/15"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-5 py-1.5 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>

              <div className="mb-6">
                <span className="text-4xl font-black text-white">${plan.price}</span>
                <span className="text-slate-500 ml-1">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="space-y-3">
                  <div className="w-full text-center py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-sm">
                    ✓ Current Plan
                  </div>
                  <button
                    onClick={handleManage}
                    disabled={loading === "manage"}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-white text-sm transition-all"
                  >
                    {loading === "manage" ? "Loading..." : "Manage Subscription"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={!!loading}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white glow-indigo-sm"
                      : "bg-white/8 hover:bg-white/12 border border-white/10 text-white"
                  }`}
                >
                  {isLoading ? "Loading..." : "Get Started"}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
