import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { adminDb } from "@/lib/firebase-admin"
import type Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) return

  // Determine plan based on price ID
  let plan = "basic"
  let channels = 1

  if (subscription.items.data[0]?.price.id === "price_pro_test") {
    plan = "pro"
    channels = 3
  } else if (subscription.items.data[0]?.price.id === "price_enterprise_test") {
    plan = "enterprise"
    channels = 10
  }

  await adminDb
    .collection("users")
    .doc(userId)
    .update({
      "subscription.plan": plan,
      "subscription.status": subscription.status,
      "subscription.channels": channels,
      "subscription.stripeSubscriptionId": subscription.id,
      "subscription.currentPeriodEnd": new Date(subscription.current_period_end * 1000),
    })
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) return

  await adminDb.collection("users").doc(userId).update({
    "subscription.status": "canceled",
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful payment
  console.log("Payment succeeded:", invoice.id)
}
