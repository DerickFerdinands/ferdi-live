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
    priceId: "price_basic_test",
  },
  pro: {
    name: "Pro",
    price: 99,
    channels: 3,
    features: ["3 Channels", "HD Streaming", "DVR Recording", "Advanced Analytics"],
    priceId: "price_pro_test",
  },
  enterprise: {
    name: "Enterprise",
    price: 299,
    channels: 10,
    features: ["10 Channels", "4K Streaming", "DVR Recording", "Geo-locking", "Priority Support"],
    priceId: "price_enterprise_test",
  },
}
