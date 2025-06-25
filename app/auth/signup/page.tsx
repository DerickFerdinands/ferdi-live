"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PackageSelection } from "@/components/package-selection"
import { Play, ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { STRIPE_PLANS } from "@/lib/stripe"
import { useToast } from "@/hooks/use-toast"

export default function SignUpPage() {
  const [step, setStep] = useState(1) // 1: Package Selection, 2: Account Details, 3: Payment
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handlePackageSelect = (packageKey: string) => {
    setSelectedPackage(packageKey)
  }

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setStep(3) // Move to payment step
  }

  const handlePaymentSubmit = async () => {
    if (!selectedPackage) {
      setError("Please select a package")
      return
    }

    setLoading(true)
    try {
      // Create user account first
      await signUp(email, password)

      // Get the user token for payment
      const user = useAuth().user
      if (!user) {
        throw new Error("User not available")
      }

      const token = await user.getIdToken()

      // Create checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planKey: selectedPackage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      }
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to process signup.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Don't render if user is already logged in
  if (user) {
    return null
  }

  const selectedPlan = selectedPackage ? STRIPE_PLANS[selectedPackage as keyof typeof STRIPE_PLANS] : null

  return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Play className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Join Ferdi Live</h1>
            <p className="text-gray-600 mt-2">Start your professional streaming journey today</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Choose Plan</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Account Details</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className={`flex items-center ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                >
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Payment</span>
              </div>
            </div>
          </div>

          {/* Step 1: Package Selection */}
          {step === 1 && (
              <div className="space-y-6">
                <PackageSelection onPackageSelect={handlePackageSelect} selectedPackage={selectedPackage} />

                <div className="flex justify-between">
                  <Link href="/auth/signin">
                    <Button variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>
                  <Button onClick={() => setStep(2)} disabled={!selectedPackage}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Create Your Account</CardTitle>
                  <CardDescription>
                    Selected: <strong>{selectedPlan?.name}</strong> - ${selectedPlan?.price}/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Complete Your Subscription</CardTitle>
                  <CardDescription>
                    Start your 14-day free trial with the <strong>{selectedPlan?.name}</strong> plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                  )}

                  {/* Plan Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">{selectedPlan?.name} Plan</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Price: ${selectedPlan?.price}/month</div>
                      <div>Channels: {selectedPlan?.channels}</div>
                      <div>Free trial: 14 days</div>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>Test Payment:</strong> Use card 4242 4242 4242 4242, any future expiry date, and any CVC. You
                      won't be charged during the free trial.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="flex-1"
                        disabled={loading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={handlePaymentSubmit} className="flex-1" disabled={loading}>
                      {loading ? "Processing..." : "Start Free Trial"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
  )
}
