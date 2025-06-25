"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { STRIPE_PLANS } from "@/lib/stripe"
import { CreditCard, Check, AlertCircle, Download, Calendar, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

interface Invoice {
  id: string
  date: Date
  amount: number
  status: "paid" | "pending" | "failed"
  plan: string
  period: string
}

interface UsageData {
  channels: number
  streamingHours: number
  storage: number
  bandwidth: number
}

export default function BillingPage() {
  const { userData, user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usage, setUsage] = useState<UsageData>({
    channels: 2,
    streamingHours: 45,
    storage: 2.3,
    bandwidth: 156.7,
  })

  const currentPlan = userData?.subscription?.plan || "basic"
  const currentPlanData = STRIPE_PLANS[currentPlan as keyof typeof STRIPE_PLANS]

  useEffect(() => {
    // Handle success/cancel from Stripe
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")

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

    // Mock invoice data
    setInvoices([
      {
        id: "inv_001",
        date: new Date("2024-01-01"),
        amount: 99,
        status: "paid",
        plan: "Pro",
        period: "Jan 2024",
      },
      {
        id: "inv_002",
        date: new Date("2024-02-01"),
        amount: 99,
        status: "paid",
        plan: "Pro",
        period: "Feb 2024",
      },
      {
        id: "inv_003",
        date: new Date("2024-03-01"),
        amount: 99,
        status: "pending",
        plan: "Pro",
        period: "Mar 2024",
      },
    ])
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

  const downloadInvoice = (invoice: Invoice) => {
    // Mock invoice download
    const invoiceData = {
      id: invoice.id,
      date: invoice.date.toISOString(),
      amount: invoice.amount,
      plan: invoice.plan,
      period: invoice.period,
      customer: userData?.email,
    }
    const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${invoice.id}.json`
    a.click()
  }

  return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription, usage, and billing information</p>
        </div>

        {/* Test Mode Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Mode:</strong> This is using Stripe test mode. Use test card number 4242 4242 4242 4242 for
            testing payments.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Subscription
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
                    {usage.channels} / {currentPlanData?.channels}
                  </span>
                  </div>
                  <Progress value={(usage.channels / (currentPlanData?.channels || 1)) * 100} className="h-2" />
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

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${currentPlanData?.price}</div>
                  <p className="text-xs text-muted-foreground">Next billing: Mar 1, 2024</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Streaming Hours</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usage.streamingHours}h</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usage.storage} GB</div>
                  <p className="text-xs text-muted-foreground">Used this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bandwidth</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usage.bandwidth} GB</div>
                  <p className="text-xs text-muted-foreground">Transferred this month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage & Limits</CardTitle>
                <CardDescription>Your current usage against plan limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Channels</span>
                      <span className="text-sm">
                      {usage.channels} / {currentPlanData?.channels}
                    </span>
                    </div>
                    <Progress value={(usage.channels / (currentPlanData?.channels || 1)) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Streaming Hours</span>
                      <span className="text-sm">{usage.streamingHours} / 100 hours</span>
                    </div>
                    <Progress value={usage.streamingHours} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Storage Used</span>
                      <span className="text-sm">{usage.storage} / 10 GB</span>
                    </div>
                    <Progress value={(usage.storage / 10) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Bandwidth</span>
                      <span className="text-sm">{usage.bandwidth} / 500 GB</span>
                    </div>
                    <Progress value={(usage.bandwidth / 500) * 100} className="h-2" />
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Usage resets on the 1st of each month. Upgrade your plan for higher limits.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice History</CardTitle>
                <CardDescription>Download and manage your billing history</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                          <TableCell>{invoice.date.toLocaleDateString()}</TableCell>
                          <TableCell>{invoice.plan}</TableCell>
                          <TableCell>{invoice.period}</TableCell>
                          <TableCell>${invoice.amount}</TableCell>
                          <TableCell>
                            <Badge
                                variant={
                                  invoice.status === "paid"
                                      ? "default"
                                      : invoice.status === "pending"
                                          ? "secondary"
                                          : "destructive"
                                }
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => downloadInvoice(invoice)}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
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
          </TabsContent>
        </Tabs>

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
