import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
    try{
        const user = await getCurrentUser()
        if(!user) {
            return NextResponse.json({success:false},{status:401})
        }
        const subscription = await prisma.subscription.findUnique({
            where: {userId:Number(user.userId)},
        })

        if(!subscription?.stripeCustomerId) {
            return NextResponse.json(
                {success: false, message: "No subscription found"},
                {status: 404}
            )
        }

        //Create Stripe Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account`,
        })

        return NextResponse.json({success:true, url:session.url})

    } catch (error){
        console.error("Portal error:", error)
        return NextResponse.json({success:false},{status:500})
    }
}