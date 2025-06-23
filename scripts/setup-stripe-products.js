// Node.js script to create Stripe products and prices
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
})

const PLANS = {
    basic: {
        name: "Basic",
        price: 29,
        channels: 1,
        features: ["1 Channel", "HD Streaming", "Basic Analytics"],
    },
    pro: {
        name: "Pro",
        price: 99,
        channels: 3,
        features: ["3 Channels", "HD Streaming", "DVR Recording", "Advanced Analytics"],
    },
    enterprise: {
        name: "Enterprise",
        price: 299,
        channels: 10,
        features: ["10 Channels", "4K Streaming", "DVR Recording", "Geo-locking", "Priority Support"],
    },
}

async function createStripeProducts() {
    try {
        console.log("🏗️  Creating Stripe products and prices...")

        for (const [key, plan] of Object.entries(PLANS)) {
            // Create product
            const product = await stripe.products.create({
                name: `StreamFlow ${plan.name}`,
                description: `StreamFlow ${plan.name} plan - ${plan.features.join(", ")}`,
                metadata: {
                    plan: key,
                    channels: plan.channels.toString(),
                },
            })

            // Create price
            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: plan.price * 100, // Convert to cents
                currency: "usd",
                recurring: {
                    interval: "month",
                },
                metadata: {
                    plan: key,
                },
            })

            console.log(`✅ Created ${plan.name} plan:`)
            console.log(`   Product ID: ${product.id}`)
            console.log(`   Price ID: ${price.id}`)
            console.log(`   Update your lib/stripe.ts with: priceId: "${price.id}"`)
            console.log("")
        }

        console.log("🎉 All Stripe products created successfully!")
        console.log("\n📝 Next steps:")
        console.log("1. Update the priceId values in lib/stripe.ts with the Price IDs above")
        console.log("2. Set up your Stripe webhook endpoint")
        console.log("3. Add STRIPE_WEBHOOK_SECRET to your environment variables")
    } catch (error) {
        console.error("❌ Error creating Stripe products:", error)
    }
}

// Run the setup
createStripeProducts()
