"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, Zap, ArrowRight, Lock } from "lucide-react"
import { STRIPE_PLANS } from "@/lib/stripe"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface UpgradePromptProps {
    currentPlan: string
    requiredPlan: string
    feature: string
    onUpgrade?: () => void
}

export function UpgradePrompt({ currentPlan, requiredPlan, feature, onUpgrade }: UpgradePromptProps) {
    const { user } = useAuth()
    const { toast } = useToast()

    const currentPlanConfig = STRIPE_PLANS[currentPlan as keyof typeof STRIPE_PLANS]
    const requiredPlanConfig = STRIPE_PLANS[requiredPlan as keyof typeof STRIPE_PLANS]

    const handleUpgrade = async () => {
        if (!user) return

        try {
            const token = await user.getIdToken()

            const response = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ planKey: requiredPlan }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create checkout session")
            }

            if (data.url) {
                window.location.href = data.url
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to start upgrade process.",
                variant: "destructive",
            })
        }

        onUpgrade?.()
    }

    return (
        <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Lock className="h-5 w-5" />
                    Feature Upgrade Required
                </CardTitle>
                <CardDescription className="text-orange-700">
                    The <strong>{feature}</strong> feature requires a higher plan
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertDescription>
                        Your current <strong>{currentPlanConfig?.name}</strong> plan doesn't include {feature}. Upgrade to{" "}
                        <strong>{requiredPlanConfig?.name}</strong> to unlock this feature.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Current</Badge>
                            <span className="font-medium">{currentPlanConfig?.name}</span>
                        </div>
                        <div className="text-2xl font-bold">
                            ${currentPlanConfig?.price}
                            <span className="text-sm font-normal">/mo</span>
                        </div>
                        <div className="text-sm text-gray-600">{currentPlanConfig?.channels} channels</div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-600">Recommended</Badge>
                            <span className="font-medium">{requiredPlanConfig?.name}</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                            ${requiredPlanConfig?.price}
                            <span className="text-sm font-normal">/mo</span>
                        </div>
                        <div className="text-sm text-blue-700">{requiredPlanConfig?.channels} channels</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-medium">What you'll get with {requiredPlanConfig?.name}:</h4>
                    <ul className="text-sm space-y-1">
                        {requiredPlanConfig?.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <Button onClick={handleUpgrade} className="w-full">
                    {requiredPlan === "pro" ? <Zap className="h-4 w-4 mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                    Upgrade to {requiredPlanConfig?.name}
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </CardContent>
        </Card>
    )
}
