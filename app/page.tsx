import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Users, BarChart3, Shield } from "lucide-react"
import Link from "next/link"
import { FirebaseStatus } from "@/components/firebase-status"

export default function HomePage() {
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Play className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Ferdi Live</span>
            </div>
            <div className="space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Professional Live Streaming
              <span className="text-blue-600"> Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Launch, manage, and scale your live streaming channels with enterprise-grade infrastructure. Built for
              content creators, broadcasters, and businesses by Ferdi Live.
            </p>
            <div className="space-x-4">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8">
                Watch Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardHeader>
                  <Play className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle>Instant Streaming</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Launch live streams in seconds with our automated infrastructure provisioning.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="h-12 w-12 text-green-600 mb-4" />
                  <CardTitle>Multi-Tenant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Manage multiple channels and teams with role-based access control.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                  <CardTitle>Real-time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Track viewer engagement, geographic distribution, and performance metrics.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="h-12 w-12 text-red-600 mb-4" />
                  <CardTitle>Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Advanced security features including geo-locking and access controls.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                  <div className="text-3xl font-bold">
                    $29<span className="text-sm font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    <li>✓ 1 Channel</li>
                    <li>✓ HD Streaming</li>
                    <li>✓ Basic Analytics</li>
                    <li>✓ Email Support</li>
                  </ul>
                  <Button className="w-full">Start Free Trial</Button>
                </CardContent>
              </Card>
              <Card className="border-blue-500 border-2 relative">
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">Most Popular</Badge>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>For growing businesses</CardDescription>
                  <div className="text-3xl font-bold">
                    $99<span className="text-sm font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    <li>✓ 3 Channels</li>
                    <li>✓ HD Streaming</li>
                    <li>✓ DVR Recording</li>
                    <li>✓ Advanced Analytics</li>
                    <li>✓ Priority Support</li>
                  </ul>
                  <Button className="w-full">Start Free Trial</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For large organizations</CardDescription>
                  <div className="text-3xl font-bold">
                    $299<span className="text-sm font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    <li>✓ 10 Channels</li>
                    <li>✓ 4K Streaming</li>
                    <li>✓ DVR Recording</li>
                    <li>✓ Geo-locking</li>
                    <li>✓ 24/7 Support</li>
                  </ul>
                  <Button className="w-full">Contact Sales</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Debug Section - Only show in development */}
        {process.env.NODE_ENV === "development" && (
            <section className="py-16 bg-yellow-50">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold text-center mb-8">System Status (Development)</h2>
                <div className="flex justify-center">
                  <FirebaseStatus />
                </div>
              </div>
            </section>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Play className="h-6 w-6" />
                <span className="text-xl font-bold">Ferdi Live</span>
              </div>
              <p className="text-gray-400">© 2024 Ferdi Live. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
  )
}
