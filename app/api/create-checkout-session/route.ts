import { type NextRequest, NextResponse } from "next/server"
import { stripe, STRIPE_PLANS } from "@/lib/stripe"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { planKey } = await request.json()

    if (!planKey || !STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const plan = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS]

    // Get or create Stripe customer
    const userDoc = await adminDb.collection("users").doc(userId).get()
    const userData = userDoc.data()

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let customerId = userData.stripeCustomerId

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          userId,
          tenantId: userData.tenantId,
        },
      })

      customerId = customer.id

      // Save customer ID to user document
      await adminDb.collection("users").doc(userId).update({
        stripeCustomerId: customerId,
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId,
        planKey,
      },
      subscription_data: {
        metadata: {
          userId,
          planKey,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 })
  }
}
