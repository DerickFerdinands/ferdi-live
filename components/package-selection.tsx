"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, CreditCard, Zap, Crown } from "lucide-react"
import { STRIPE_PLANS } from "@/lib/stripe"
import { useToast } from "@/hooks/use-toast"

interface PackageSelectionProps {
    onPackageSelect: (packageKey: string) => void
    selectedPackage?: string
    loading?: boolean
}

export function PackageSelection({ onPackageSelect, selectedPackage, loading }: PackageSelectionProps) {
    const { toast } = useToast()

    const getPackageIcon = (key: string) => {
        switch (key) {
            case "basic":
                return <CreditCard className="h-6 w-6" />
            case "pro":
                return <Zap className="h-6 w-6" />
            case "enterprise":
                return <Crown className="h-6 w-6" />
            default:
                return <CreditCard className="h-6 w-6" />
        }
    }

    const getPackageColor = (key: string) => {
        switch (key) {
            case "basic":
                return "text-blue-600"
            case "pro":
                return "text-purple-600"
            case "enterprise":
                return "text-orange-600"
            default:
                return "text-blue-600"
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-gray-600">Select a plan to get started with Ferdi Live streaming</p>
            </div>

            <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                    <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 for testing payments. All plans include a
                    14-day free trial.
                </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-3">
                {Object.entries(STRIPE_PLANS).map(([key, plan]) => (
                    <Card
                        key={key}
                        className={`relative cursor-pointer transition-all hover:shadow-lg ${
                            selectedPackage === key ? "border-blue-500 border-2 shadow-lg" : ""
                        }`}
                        onClick={() => onPackageSelect(key)}
                    >
                        {key === "pro" && (
                            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">Most Popular</Badge>
                        )}

                        <CardHeader className="text-center">
                            <div className={`mx-auto mb-4 ${getPackageColor(key)}`}>{getPackageIcon(key)}</div>
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                            <CardDescription>
                                <div className="text-3xl font-bold text-gray-900">
                                    ${plan.price}
                                    <span className="text-sm font-normal text-gray-500">/month</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">14-day free trial</div>
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <ul className="space-y-3">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Quality Profiles Preview */}
                            <div className="pt-3 border-t">
                                <div className="text-xs font-medium text-gray-700 mb-2">Quality Profiles:</div>
                                <div className="flex flex-wrap gap-1">
                                    {plan.qualityProfiles.map((profile, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {profile.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* HLS Features Preview */}
                            <div className="pt-2">
                                <div className="text-xs font-medium text-gray-700 mb-2">Features:</div>
                                <div className="space-y-1 text-xs text-gray-600">
                                    <div>DVR: {plan.hlsSettings.dvrDuration} minutes</div>
                                    {plan.hlsSettings.vttEnabled && <div>✓ VTT Subtitles</div>}
                                    {plan.hlsSettings.geoLocking.enabled && <div>✓ Geo-locking</div>}
                                    {plan.hlsSettings.catchupTvEnabled && <div>✓ Catch-up TV ({plan.hlsSettings.catchupDuration}h)</div>}
                                </div>
                            </div>

                            <Button className="w-full" variant={selectedPackage === key ? "default" : "outline"} disabled={loading}>
                                {selectedPackage === key ? "Selected" : `Choose ${plan.name}`}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedPackage && (
                <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                        You've selected the <strong>{STRIPE_PLANS[selectedPackage as keyof typeof STRIPE_PLANS].name}</strong> plan.
                        Complete your registration to start your free trial.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
