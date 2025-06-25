"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Crown, Zap, CreditCard, Calendar } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { STRIPE_PLANS } from "@/lib/stripe"
import { useToast } from "@/hooks/use-toast"

export function SubscriptionStatus() {
    const { userData, user } = useAuth()
    const { toast } = useToast()

    const userPlan = userData?.subscription?.plan || "basic"
    const planConfig = STRIPE_PLANS[userPlan as keyof typeof STRIPE_PLANS]

    const handleManageBilling = async () => {
        if (!user) return

        try {
            const token = await user.getIdToken()

            const response = await fetch("/api/create-portal-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create portal session")
            }

            if (data.url) {
                window.location.href = data.url
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to open billing portal.",
                variant: "destructive",
            })
        }
    }

    // @ts-ignore
    const channelsUsed = userData?.channels?.length || 0
    const channelsLimit = userData?.subscription?.channels || 1
    const usagePercentage = (channelsUsed / channelsLimit) * 100

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {userPlan === "enterprise" ? (
                        <Crown className="h-5 w-5 text-yellow-600" />
                    ) : userPlan === "pro" ? (
                        <Zap className="h-5 w-5 text-blue-600" />
                    ) : (
                        <CreditCard className="h-5 w-5 text-gray-600" />
                    )}
                    Current Plan: {planConfig?.name}
                    <Badge variant={userPlan === "basic" ? "secondary" : "default"}>{userPlan}</Badge>
                </CardTitle>
                <CardDescription>
                    {userData?.subscription?.status === "active" ? "Active subscription" : "Free plan"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Channels Used</span>
                        <span>
              {channelsUsed} / {channelsLimit}
            </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="font-medium">Monthly Price</div>
                        <div className="text-2xl font-bold">${planConfig?.price}</div>
                    </div>
                    <div>
                        <div className="font-medium">Next Billing</div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {userData?.subscription?.currentPeriodEnd
                                ? new Date(userData.subscription.currentPeriodEnd).toLocaleDateString()
                                : "N/A"}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="font-medium text-sm">Plan Features:</div>
                    <ul className="text-xs space-y-1">
                        {planConfig?.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <Button onClick={handleManageBilling} variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Billing
                </Button>
            </CardContent>
        </Card>
    )
}
