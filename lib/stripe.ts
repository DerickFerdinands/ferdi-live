import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export const STRIPE_PLANS = {
  basic: {
    name: "Basic",
    price: 29,
    channels: 1,
    features: ["1 Channel", "HD Streaming", "Basic Analytics"],
    priceId: "price_1QSampleBasicTestId", // Replace with actual Stripe Price ID
  },
  pro: {
    name: "Pro",
    price: 99,
    channels: 3,
    features: ["3 Channels", "HD Streaming", "DVR Recording", "Advanced Analytics"],
    priceId: "price_1QSampleProTestId", // Replace with actual Stripe Price ID
  },
  enterprise: {
    name: "Enterprise",
    price: 299,
    channels: 10,
    features: ["10 Channels", "4K Streaming", "DVR Recording", "Geo-locking", "Priority Support"],
    priceId: "price_1QSampleEnterpriseTestId", // Replace with actual Stripe Price ID
  },
}

// Create Stripe products and prices for testing
export async function createStripeProducts() {
  try {
    for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
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

      console.log(`Created ${plan.name} plan:`, {
        productId: product.id,
        priceId: price.id,
      })
    }
  } catch (error) {
    console.error("Error creating Stripe products:", error)
  }
}
