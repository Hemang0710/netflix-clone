"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PLANS } from "@/lib/plans"

export default function PricingPlans({ currentPlan }) {
  const router = useRouter()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromoCode, setAppliedPromoCode] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoSuccess, setPromoSuccess] = useState("")

  async function handleRedeemPromo() {
    if (!promoCode.trim()) {
      setError("Please enter a promo code")
      return
    }
    setPromoLoading(true)
    setError("")
    setPromoSuccess("")
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "dummy", // Just for validation
          planId: "basic",
          discountCode: promoCode.toUpperCase(),
          validateOnly: true
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || "Promo code is not valid")
        return
      }
      setAppliedPromoCode(promoCode.toUpperCase())
      setPromoSuccess("✓ Promo code applied! You'll pay $0 at checkout.")
      setPromoCode("")
      setError("")
    } catch (err) {
      console.error("Promo validation error:", err)
      setError("Promo code is not valid")
    } finally {
      setPromoLoading(false)
    }
  }

  async function handleSubscribe(plan) {
    setLoading(plan.id)
    setError("")
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          planId: plan.id,
          ...(appliedPromoCode && {discountCode: appliedPromoCode})
        }),
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

      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Have a promo code?
        </label>
        {appliedPromoCode ? (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
              ✓ {appliedPromoCode}
            </div>
            <button
              onClick={() => {
                setAppliedPromoCode("")
                setPromoSuccess("")
              }}
              className="text-sm text-slate-400 hover:text-slate-300 underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter the promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              disabled={promoLoading}
              className={`flex-1 md:flex-none md:w-80 px-4 py-2 rounded-lg bg-white/5 border text-white placeholder-slate-500 focus:outline-none disabled:opacity-50 ${
                error && promoCode ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500/50'
              }`}
            />
            <button
              onClick={handleRedeemPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {promoLoading ? "Validating..." : "Redeem"}
            </button>
          </div>
        )}
        {error && !appliedPromoCode && (
          <p className="text-red-400 text-sm mt-2 font-medium">⚠ {error}</p>
        )}
        {promoSuccess && (
          <p className="text-emerald-400 text-sm mt-2 font-medium">{promoSuccess}</p>
        )}
      </div>

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
