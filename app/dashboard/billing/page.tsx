"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { STRIPE_PLANS } from "@/lib/stripe"
import { CreditCard, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function BillingPage() {
  const { userData, user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const currentPlan = userData?.subscription?.plan || "basic"
  const currentPlanData = STRIPE_PLANS[currentPlan as keyof typeof STRIPE_PLANS]
  const channelsUsed = 2 // This would come from actual channel count
  const channelsLimit = currentPlanData?.channels || 1

  useEffect(() => {
    // Handle success/cancel from Stripe
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")
    const sessionId = searchParams.get("session_id")

    if (success === "true") {
      toast({
        title: "Payment Successful!",
        description: "Your subscription has been updated successfully.",
      })
    } else if (canceled === "true") {
      toast({
        title: "Payment Canceled",
        description: "Your subscription was not changed.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const handleUpgrade = async (planKey: string) => {
    if (!user) return

    setUpgrading(planKey)
    try {
      const token = await user.getIdToken()

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planKey }),
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
        description: error.message || "Failed to create checkout session.",
        variant: "destructive",
      })
    } finally {
      setUpgrading(null)
    }
  }

  const handleManageBilling = async () => {
    if (!user) return

    setLoading(true)
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
        description: error.message || "Failed to access billing portal.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        {/* Test Mode Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Mode:</strong> This is using Stripe test mode. Use test card number 4242 4242 4242 4242 for
            testing payments.
          </AlertDescription>
        </Alert>

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
              <Button onClick={handleManageBilling} variant="outline" disabled={loading}>
                {loading ? "Loading..." : "Manage Billing"}
              </Button>
              {currentPlan !== "enterprise" && (
                  <Button onClick={() => handleUpgrade("pro")} disabled={upgrading === "pro"}>
                    {upgrading === "pro" ? "Processing..." : "Upgrade Plan"}
                  </Button>
              )}
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
                        disabled={currentPlan === key || upgrading === key}
                        onClick={() => handleUpgrade(key)}
                    >
                      {upgrading === key
                          ? "Processing..."
                          : currentPlan === key
                              ? "Current Plan"
                              : `Upgrade to ${plan.name}`}
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

        {/* Test Card Information */}
        <Card>
          <CardHeader>
            <CardTitle>Test Payment Information</CardTitle>
            <CardDescription>Use these test cards for Stripe payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Success:</strong> 4242 4242 4242 4242
              </div>
              <div>
                <strong>Declined:</strong> 4000 0000 0000 0002
              </div>
              <div>
                <strong>Requires Authentication:</strong> 4000 0025 0000 3155
              </div>
              <div>
                <strong>Expiry:</strong> Any future date
              </div>
              <div>
                <strong>CVC:</strong> Any 3 digits
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
