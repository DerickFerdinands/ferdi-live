"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { STRIPE_PLANS } from "@/lib/stripe"
import { CreditCard, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BillingPage() {
  const { userData } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const currentPlan = userData?.subscription?.plan || "basic"
  const currentPlanData = STRIPE_PLANS[currentPlan as keyof typeof STRIPE_PLANS]
  const channelsUsed = 2 // This would come from actual channel count
  const channelsLimit = currentPlanData?.channels || 1

  const handleUpgrade = async (planKey: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS].priceId,
          userId: userData?.uid,
        }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData?.uid }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access billing portal.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{currentPlanData?.name}</h3>
              <p className="text-gray-600">${currentPlanData?.price}/month</p>
            </div>
            <Badge variant={userData?.subscription?.status === "active" ? "default" : "secondary"}>
              {userData?.subscription?.status || "trial"}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Channels Used</span>
              <span>
                {channelsUsed} / {channelsLimit}
              </span>
            </div>
            <Progress value={(channelsUsed / channelsLimit) * 100} className="h-2" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleManageBilling} variant="outline">
              Manage Billing
            </Button>
            {currentPlan !== "enterprise" && <Button onClick={() => handleUpgrade("pro")}>Upgrade Plan</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(STRIPE_PLANS).map(([key, plan]) => (
            <Card key={key} className={currentPlan === key ? "border-blue-500 border-2" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>${plan.price}/month</CardDescription>
                  </div>
                  {currentPlan === key && <Badge>Current</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={currentPlan === key ? "secondary" : "default"}
                  disabled={currentPlan === key || loading}
                  onClick={() => handleUpgrade(key)}
                >
                  {currentPlan === key ? "Current Plan" : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Your current usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Streaming Hours</span>
                <span className="text-sm">45 / 100 hours</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Storage Used</span>
                <span className="text-sm">2.3 / 10 GB</span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
