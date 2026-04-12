import Stripe from "stripe"

//Single Stripe instance - reused across requests

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY,{
    apiVersion: "2026-03-25.dahlia",
    maxNetworkRetries: 3,
})

export default stripe
