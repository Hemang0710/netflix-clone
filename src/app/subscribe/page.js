import PricingPlans from "@/components/PricingPlans"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { use } from "react"

export default async function SubscribePage() {
    const user = await getCurrentUser()

    const subscription = user
    ? await prisma.subscription.findUnique({
        where: {userId: Number(user.userId)},
    })
    :null
    
    return(
        <main className="min-h-screen bg-zinc-950 text-white py-16 px-6">
            <div className="max-w-5x1 mx-auto text-center">
                <h1 className="text-5xl font-black mb-4">
                    Choose Your Plan
                </h1>
                <p className="text-zinc-400 text-xl mb-12">
                    unlock unlimited streaming. Cancel anytime.
                </p>
                <PricingPlans currentPlan = {subscription?.plan} />
            </div>
        </main>
    )
}