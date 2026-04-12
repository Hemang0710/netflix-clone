import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POS(request) {
    try {
        const user = await getCurrentUser()
        if(!user){
            return NextResponse.json(
                {success: false, message: "Not authenticated"},
                {status: 401}
            )
        }

        const {priceId, planId} = await request.json()

        if(!priceId) {
            return NextResponse.json(
                {success: false, message: "Price ID required"},
                {status: 400}
            )
        }

        //Get or create Stripe customer
        let stripeCustomerId = null

        const existingSub = await prisma.subscription.findUnique({
            where: {userId: Number(user.userId)},
        })

        if(existingSub?.stripeCustomerId){
            stripeCustomerId = existingSub.stripeCustomerId
        } else {
            //Create new Stripe customer linked to this user
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {userId: String(user.userId)},
            })
            stripeCustomerId = customer.id
        }

        //Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ["card"],
            line_items:[{price:priceId, quantity: 1}],
            mode: "subscription",
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscribe`,
            metadata: {
                userId: String(user.userId),
                planId,
            },
        })

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        })
    } catch (error) {
        console.error("Checkout error:",error)
        return NextResponse.json(
            {success:false, message: "Failed to create checkout"},
            {status: 500}
        )
    }
}