"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { STRIPE_PLANS } from "@/lib/stripe"

interface FeatureGateProps {
    children: ReactNode
    feature: string
    requiredPlan: string
    fallback?: ReactNode
}

export function FeatureGate({ children, feature, requiredPlan, fallback }: FeatureGateProps) {
    const { userData } = useAuth()

    const userPlan = userData?.subscription?.plan || "basic"
    const planConfig = STRIPE_PLANS[userPlan as keyof typeof STRIPE_PLANS]
    const requiredPlanConfig = STRIPE_PLANS[requiredPlan as keyof typeof STRIPE_PLANS]

    // Check if user's plan includes the required feature
    const hasFeature = () => {
        if (!planConfig || !requiredPlanConfig) return false

        // Simple plan hierarchy check
        const planHierarchy = ["basic", "pro", "enterprise"]
        const userPlanIndex = planHierarchy.indexOf(userPlan)
        const requiredPlanIndex = planHierarchy.indexOf(requiredPlan)

        return userPlanIndex >= requiredPlanIndex
    }

    if (hasFeature()) {
        return <>{children}</>
    }

    return <>{fallback || null}</>
}
