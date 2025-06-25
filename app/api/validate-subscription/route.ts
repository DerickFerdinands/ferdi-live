import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { STRIPE_PLANS } from "@/lib/stripe"

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.split("Bearer ")[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const userId = decodedToken.uid

        const { feature, requiredPlan } = await request.json()

        // Get user data
        const userDoc = await adminDb.collection("users").doc(userId).get()
        const userData = userDoc.data()

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const currentPlan = userData.subscription?.plan || "basic"
        const planConfig = STRIPE_PLANS[currentPlan as keyof typeof STRIPE_PLANS]

        let hasAccess = false

        switch (feature) {
            case "geoLocking":
                hasAccess = planConfig?.hlsSettings.geoLocking.enabled || false
                break
            case "ipRestrictions":
                hasAccess = planConfig?.hlsSettings.ipRestrictions.enabled || false
                break
            case "catchupTv":
                hasAccess = planConfig?.hlsSettings.catchupTvEnabled || false
                break
            case "vtt":
                hasAccess = planConfig?.hlsSettings.vttEnabled || false
                break
            case "4k":
                hasAccess = planConfig?.qualityProfiles.some((p) => p.name === "4K") || false
                break
            case "multipleChannels":
                hasAccess = (planConfig?.channels || 1) > 1
                break
            default:
                hasAccess = true
        }

        return NextResponse.json({
            hasAccess,
            currentPlan,
            requiredPlan,
            planConfig: {
                name: planConfig?.name,
                price: planConfig?.price,
                channels: planConfig?.channels,
                features: planConfig?.features,
            },
        })
    } catch (error) {
        console.error("Error validating subscription:", error)
        return NextResponse.json({ error: "Failed to validate subscription" }, { status: 500 })
    }
}
