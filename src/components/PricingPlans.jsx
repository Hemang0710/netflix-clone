"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PLANS } from "@/lib/plans"

export default function PricingPlans({currentPlan}){
    const router = useRouter()
    const [loading,setLoading] = useState(null)
    const [error,setError] = useState("")

    async function handleSubscribe(plan) {
        setLoading(plan.id)
        setError("")

        try{
            const res = await fetch("/api/stripe/checkout",{
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    priceId: plan.priceId,
                    planId: plan.id,
                }),
            })

            const data = await res.json()

            if(!res.ok){
                setError(data.message || "Something went wrong")
                return
            }

            //Redirect to Stripe checkout
            window.location.href = data.url
        } catch {
            setError ("Failed to start checkout. Try again.")
        } finally {
            setLoading(null)
        }
    }

    async function handleManage() {
        setLoading("manage")
        const res = await fetch("/api/stripe/portal",{method:"POST"})
        const data = await res.json()
        if(data.url) window.location.href = data.url
        setLoading(null)
    }

    return (
        <div>
            {error && (
                <p className="text-red-500 mb-6">{error}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map(plan => {
                    const isCurrentPlan = currentPlan === plan.id
                    const isLoading = loading === plan.id

                    return(
                        <div 
                            key={plan.id}
                            className= {`relative rounded-2x1 p-8 border transition-all ${
                                plan.popular
                                    ? "border-red-500 bg-zinc-900 scale-105"
                                    : "border-zinc-700 bg-zinc-900/50"
                            }`}
                        >
                          {/* Popular badge */}
                          {plan.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                                MOST POPULAR
                            </div>
                          )}

                          <h3 className="text-x1 font-bold mb-2">{plan.name}</h3>

                          <div className="mb-6">
                            <span className="text-4x1 font-black">${plan.price}</span>
                            <span className="text-zinc-400">/month</span>
                          </div>
                          
                          <ul className="space-y-3 mb-8">
                            {plan.features.map(feature => (
                                <li key={feature} className="flex items-center gap-2 text-sm">
                                    <span className="text-green-400">✓</span>
                                    <span className="text-zinc-300">{feature}</span>
                                </li>
                            ))}
                          </ul>

                          {isCurrentPlan ? (
                            <div className="space-y-3">
                                <div className="w-full text-center py-3 rounded-lg bg-green-600/20 text-green-400 font-semibold border border-green-600/30">
                                ✓ Current Plan
                                </div>
                                <button
                                 onClick={handleManage}
                                 disabled={loading === "manage"}
                                 className="w-full py-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">
                                    {loading === "manage" ? "Loading...": "Manage Subscription"}
                                 </button>
                                 </div>
                          ):(
                            <button 
                               onClick={() => handleSubscribe(plan)}
                               disabled={!loading}
                               className={`w-full py-3 rounded-lg font-bold transition-colors ${
                                plan.popular
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-zinc-700 hover:bg-zinc-600 text-white"
                               } disabled:opacity-50 disabled:cursor-not-allowed
                               `}
                            >
                            {isLoading ? "Loading..." :"Get Started"}
                            </button>
                          )}
                          </div>
                    )
                })}
            </div>
        </div>
    )
}