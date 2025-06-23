import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
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

    // Get customer ID from Firebase
    const userDoc = await adminDb.collection("users").doc(userId).get()
    const userData = userDoc.data()

    if (!userData?.stripeCustomerId) {
      return NextResponse.json({ error: "No customer found. Please subscribe to a plan first." }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: error.message || "Failed to create portal session" }, { status: 500 })
  }
}
