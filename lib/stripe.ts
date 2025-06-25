import Stripe from "stripe"

/**
 * Only create the real Stripe instance on the server where the secret key
 * exists.  On the client we export `null` so importing files (e.g. React
 * pages) don’t crash while they just need STRIPE_PLANS.
 */
export const stripe: Stripe | null =
    typeof window === "undefined"
        ? (() => {
          const key = process.env.STRIPE_SECRET_KEY
          if (!key) {
            console.warn("⚠️  STRIPE_SECRET_KEY is missing - Stripe disabled")
            return null as unknown as Stripe
          }
          return new Stripe(key, { apiVersion: "2024-06-20" })
        })()
        : null

export const STRIPE_PLANS = {
  basic: {
    name: "Basic",
    price: 29,
    channels: 1,
    features: ["1 Channel", "HD Streaming", "Basic Analytics", "30min DVR"],
    priceId: "price_1QSampleBasicTestId", // Replace with actual Stripe Price ID
    qualityProfiles: [
      { name: "720p", resolution: "1280x720", bitrate: 2000, fps: 30, enabled: true },
      { name: "480p", resolution: "854x480", bitrate: 1000, fps: 30, enabled: true },
    ],
    hlsSettings: {
      vttEnabled: false,
      segmentLength: 6,
      dvrDuration: 30,
      geoLocking: { enabled: false, allowedCountries: [], blockedCountries: [] },
      ipRestrictions: { enabled: false, allowedIPs: [], blockedIPs: [] },
      catchupTvEnabled: false,
      catchupDuration: 0,
    },
  },
  pro: {
    name: "Pro",
    price: 99,
    channels: 3,
    features: ["3 Channels", "HD Streaming", "DVR Recording", "Advanced Analytics", "Geo-locking"],
    priceId: "price_1QSampleProTestId", // Replace with actual Stripe Price ID
    qualityProfiles: [
      { name: "1080p", resolution: "1920x1080", bitrate: 4000, fps: 30, enabled: true },
      { name: "720p", resolution: "1280x720", bitrate: 2000, fps: 30, enabled: true },
      { name: "480p", resolution: "854x480", bitrate: 1000, fps: 30, enabled: true },
    ],
    hlsSettings: {
      vttEnabled: true,
      segmentLength: 6,
      dvrDuration: 120,
      geoLocking: { enabled: true, allowedCountries: [], blockedCountries: [] },
      ipRestrictions: { enabled: true, allowedIPs: [], blockedIPs: [] },
      catchupTvEnabled: true,
      catchupDuration: 24,
    },
  },
  enterprise: {
    name: "Enterprise",
    price: 299,
    channels: 10,
    features: ["10 Channels", "4K Streaming", "DVR Recording", "Geo-locking", "Priority Support", "Catch-up TV"],
    priceId: "price_1QSampleEnterpriseTestId", // Replace with actual Stripe Price ID
    qualityProfiles: [
      { name: "4K", resolution: "3840x2160", bitrate: 8000, fps: 30, enabled: true },
      { name: "1080p", resolution: "1920x1080", bitrate: 4000, fps: 30, enabled: true },
      { name: "720p", resolution: "1280x720", bitrate: 2000, fps: 30, enabled: true },
      { name: "480p", resolution: "854x480", bitrate: 1000, fps: 30, enabled: true },
    ],
    hlsSettings: {
      vttEnabled: true,
      segmentLength: 4,
      dvrDuration: 240,
      geoLocking: { enabled: true, allowedCountries: [], blockedCountries: [] },
      ipRestrictions: { enabled: true, allowedIPs: [], blockedIPs: [] },
      catchupTvEnabled: true,
      catchupDuration: 168,
    },
  },
}

// Create Stripe products and prices for testing
export async function createStripeProducts() {
  try {
    for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
      // Create product
      const product = await stripe!.products.create({
        name: `Ferdi Live ${plan.name}`,
        description: `Ferdi Live ${plan.name} plan - ${plan.features.join(", ")}`,
        metadata: {
          plan: key,
          channels: plan.channels.toString(),
        },
      })

      // Create price
      const price = await stripe!.prices.create({
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
