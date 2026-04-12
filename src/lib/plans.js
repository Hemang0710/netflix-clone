//Single source of truth for all plan data

export const PLANS =[
    {
        id: "basic",
        name: "Basic",
        price: 6.99,
        priceId: process.env.STRIPE_PRICE_BASIC,
        features: [
            "720 video quality",
            "Watch on 1 device",
            "Access all content",
            "AI transcripts",
        ],
        color: "zinc",
    },
    {
        id:"standard",
        name: "Standard",
        price: 13.99,
        priceId: process.env.STRIPE_PRICE_STANDARD,
        popular: true,
        features:[
            "1080 video quality",
            "Watch on 2 devices",
            "Access all content",
            "AI transcripts + summaries",
            "Download videos",
        ],
        color: "red",
    },
    {
        id: "premium",
        name: "Premium",
        price: 22.99,
        priceId: process.env.STRIPE_PRICE_PREMIUM,
        features: [
            "4K video quality",
            "Watch on 4 devices",
            "Access all content",
            "AI transcripts + summaries",
            "Download videos",
            "Early access to new features",
        ],
        color: "yellow",
    },
]