import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";

//Must disable body parsing - Stripe needs raw body for signature verification
// export const config = {api:{bodyParser: false}}

export async function POST(request) {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    let event

    //Verify webhook is actually from Stripe

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        console.error("Webhook signature failed:", error.message)
        return NextResponse.json(
            {error: "Invalid signature"},
            {status: 400}
        )
    }

    //Handle different Stripe events
    try {
        switch (event.type){

            //Payment succeeded - activate subscription

            case "checkout.session.completed": {
                const session = event.data.object
                const userId = Number(session.metadata.userId)
                const planId = session.metadata.planId

                // Get subscription details from Stripe
                const subscribe = await stripe.subscriptions.retrieve(
                    session.subscription
                )
                
                await prisma.subscription.upsert({
                    where: {userId},
                    update: {
                        stripeCustomerId: session.customer,
                        stripeSubId: session.subscription,
                        plan: planId,
                        status:"active",
                        periodEnd: new Date(subscription.current_period_end * 1000),
                    },
                    create: {
                        userId,
                        stripeCustomerId: session.customer,
                        stripeSubId : session.subscription,
                        plan: planId,
                        status: "active",
                        periodEnd: new Date (subscription.current_period_end * 1000),
                    },
                })

                //Update user role to subscriber
                await prisma.user.update({
                    where: {id: userId},
                    data: {role: "subscriber"},
                })

                console.log(`✅ Subscription activated for user ${userId}`)
                break
            }

            //Subscription renewed - update period end date
            case "invoice.paid": {
                const invoice = event.data.object
                if (invoice.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(
                        invoice.subscription
                    )
                    await prisma.subscription.update({
                        where: {stripeSubId:invoice.subscription},
                        data: {
                            status: "active",
                            periodEnd: new Date(subscription.current_period_end * 1000),
                        },
                    })
                }
                break
            }

            // Payment failed - mark subscription as past due
            case "invoice.payment_failed": {
                const invoice = event.data.object
                if(invoice.subscription){
                    await prisma.subscription.update({
                        where: {stripeSubId: invoice.subscription},
                        data:{status: "past_due"},
                    })
                }
                break
            }

            //Subscription cancelled
            case "customer.subscription.deleted": {
                const subscription = event.data.object
                await prisma.subscription.update({
                    where: {stripeSubId: subscription.id},
                    data: {status: "cancelled"},
                })
                break
            }
        }

        return NextResponse.json ({received: true})
    } catch (error) {
        console.error("Webhook handler error:", error)
        return NextResponse.json(
            {error: "Webhook handler failed"},
            {status: 500}
        )
    }
    
}