import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { adminDb } from "@/lib/firebase-admin"
import type Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("Processing Stripe webhook:", event.type)

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

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

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) return

  console.log(`Checkout completed for user: ${userId}`)

  // The subscription will be handled by the subscription.created event
  // Here we can just log or send notifications
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) {
    console.error("No userId in subscription metadata")
    return
  }

  // Determine plan based on price ID
  let plan = "basic"
  let channels = 1

  const priceId = subscription.items.data[0]?.price.id

  // Map price IDs to plans (you'll need to update these with your actual Stripe price IDs)
  if (priceId?.includes("pro") || subscription.metadata.planKey === "pro") {
    plan = "pro"
    channels = 3
  } else if (priceId?.includes("enterprise") || subscription.metadata.planKey === "enterprise") {
    plan = "enterprise"
    channels = 10
  }

  try {
    await adminDb
        .collection("users")
        .doc(userId)
        .update({
          "subscription.plan": plan,
          "subscription.status": subscription.status,
          "subscription.channels": channels,
          "subscription.stripeSubscriptionId": subscription.id,
          "subscription.currentPeriodEnd": new Date(subscription.current_period_end * 1000),
          "subscription.updatedAt": new Date(),
        })

    console.log(`Updated subscription for user ${userId}: ${plan} (${subscription.status})`)
  } catch (error) {
    console.error("Error updating user subscription:", error)
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) return

  try {
    await adminDb.collection("users").doc(userId).update({
      "subscription.status": "canceled",
      "subscription.canceledAt": new Date(),
    })

    console.log(`Subscription canceled for user: ${userId}`)
  } catch (error) {
    console.error("Error handling subscription cancellation:", error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Payment succeeded:", invoice.id)

  // You can add logic here to:
  // - Send confirmation emails
  // - Update usage tracking
  // - Log payment history
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Payment failed:", invoice.id)

  // You can add logic here to:
  // - Send payment failure notifications
  // - Temporarily suspend service
  // - Retry payment logic
}
