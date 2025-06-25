"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Video, Shield, Clock, Globe, Tv, Lock } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { STRIPE_PLANS } from "@/lib/stripe"

interface QualityProfile {
    name: string
    resolution: string
    bitrate: number
    fps: number
    enabled: boolean
}

interface HLSSettings {
    qualityProfiles: QualityProfile[]
    vttEnabled: boolean
    segmentLength: number
    dvrDuration: number
    geoLocking: {
        enabled: boolean
        allowedCountries: string[]
        blockedCountries: string[]
    }
    ipRestrictions: {
        enabled: boolean
        allowedIPs: string[]
        blockedIPs: string[]
    }
    catchupTvEnabled: boolean
    catchupDuration: number
}

interface ChannelFormData {
    name: string
    description: string
    hlsSettings: HLSSettings
}

interface ChannelCreationFormProps {
    onSubmit: (data: ChannelFormData) => void
    loading: boolean
}

const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Germany",
    "France",
    "Japan",
    "Australia",
    "Brazil",
    "India",
    "China",
]

export function ChannelCreationForm({ onSubmit, loading }: ChannelCreationFormProps) {
    const { userData } = useAuth()
    const [formData, setFormData] = useState<ChannelFormData>({
        name: "",
        description: "",
        hlsSettings: {
            qualityProfiles: [],
            vttEnabled: false,
            segmentLength: 6,
            dvrDuration: 30,
            geoLocking: {
                enabled: false,
                allowedCountries: [],
                blockedCountries: [],
            },
            ipRestrictions: {
                enabled: false,
                allowedIPs: [],
                blockedIPs: [],
            },
            catchupTvEnabled: false,
            catchupDuration: 24,
        },
    })

    const [newAllowedCountry, setNewAllowedCountry] = useState("")
    const [newBlockedCountry, setNewBlockedCountry] = useState("")
    const [newAllowedIP, setNewAllowedIP] = useState("")
    const [newBlockedIP, setNewBlockedIP] = useState("")

    // Get user's plan and apply restrictions
    const userPlan = userData?.subscription?.plan || "basic"
    const planConfig = STRIPE_PLANS[userPlan as keyof typeof STRIPE_PLANS]

    // Initialize form with plan-based defaults
    useEffect(() => {
        if (planConfig) {
            setFormData((prev) => ({
                ...prev,
                hlsSettings: {
                    ...prev.hlsSettings,
                    qualityProfiles: planConfig.qualityProfiles.map((profile) => ({ ...profile })),
                    vttEnabled: planConfig.hlsSettings.vttEnabled,
                    segmentLength: planConfig.hlsSettings.segmentLength,
                    dvrDuration: planConfig.hlsSettings.dvrDuration,
                    geoLocking: { ...planConfig.hlsSettings.geoLocking },
                    ipRestrictions: { ...planConfig.hlsSettings.ipRestrictions },
                    catchupTvEnabled: planConfig.hlsSettings.catchupTvEnabled,
                    catchupDuration: planConfig.hlsSettings.catchupDuration,
                },
            }))
        }
    }, [planConfig])

    const updateQualityProfile = (index: number, field: keyof QualityProfile, value: any) => {
        const updatedProfiles = [...formData.hlsSettings.qualityProfiles]
        updatedProfiles[index] = { ...updatedProfiles[index], [field]: value }
        setFormData({
            ...formData,
            hlsSettings: { ...formData.hlsSettings, qualityProfiles: updatedProfiles },
        })
    }

    const addCountry = (type: "allowed" | "blocked") => {
        const country = type === "allowed" ? newAllowedCountry : newBlockedCountry
        if (!country) return

        const updatedSettings = { ...formData.hlsSettings }
        if (type === "allowed") {
            updatedSettings.geoLocking.allowedCountries.push(country)
            setNewAllowedCountry("")
        } else {
            updatedSettings.geoLocking.blockedCountries.push(country)
            setNewBlockedCountry("")
        }

        setFormData({ ...formData, hlsSettings: updatedSettings })
    }

    const removeCountry = (type: "allowed" | "blocked", index: number) => {
        const updatedSettings = { ...formData.hlsSettings }
        if (type === "allowed") {
            updatedSettings.geoLocking.allowedCountries.splice(index, 1)
        } else {
            updatedSettings.geoLocking.blockedCountries.splice(index, 1)
        }
        setFormData({ ...formData, hlsSettings: updatedSettings })
    }

    const addIP = (type: "allowed" | "blocked") => {
        const ip = type === "allowed" ? newAllowedIP : newBlockedIP
        if (!ip) return

        const updatedSettings = { ...formData.hlsSettings }
        if (type === "allowed") {
            updatedSettings.ipRestrictions.allowedIPs.push(ip)
            setNewAllowedIP("")
        } else {
            updatedSettings.ipRestrictions.blockedIPs.push(ip)
            setNewBlockedIP("")
        }

        setFormData({ ...formData, hlsSettings: updatedSettings })
    }

    const removeIP = (type: "allowed" | "blocked", index: number) => {
        const updatedSettings = { ...formData.hlsSettings }
        if (type === "allowed") {
            updatedSettings.ipRestrictions.allowedIPs.splice(index, 1)
        } else {
            updatedSettings.ipRestrictions.blockedIPs.splice(index, 1)
        }
        setFormData({ ...formData, hlsSettings: updatedSettings })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validate features against plan
        const validatedSettings = { ...formData.hlsSettings }

        // Disable features not available in current plan
        if (!isFeatureAvailable("geoLocking")) {
            validatedSettings.geoLocking.enabled = false
        }
        if (!isFeatureAvailable("ipRestrictions")) {
            validatedSettings.ipRestrictions.enabled = false
        }
        if (!isFeatureAvailable("catchupTv")) {
            validatedSettings.catchupTvEnabled = false
        }
        if (!isFeatureAvailable("vtt")) {
            validatedSettings.vttEnabled = false
        }

        // Filter quality profiles based on plan
        validatedSettings.qualityProfiles = validatedSettings.qualityProfiles.filter((profile) => {
            if (profile.name === "4K" && !isFeatureAvailable("4k")) {
                return false
            }
            return true
        })

        onSubmit({ ...formData, hlsSettings: validatedSettings })
    }

    const isFeatureAvailable = (feature: string) => {
        if (!planConfig) return false

        switch (feature) {
            case "geoLocking":
                return planConfig.hlsSettings.geoLocking.enabled
            case "ipRestrictions":
                return planConfig.hlsSettings.ipRestrictions.enabled
            case "catchupTv":
                return planConfig.hlsSettings.catchupTvEnabled
            case "vtt":
                return planConfig.hlsSettings.vttEnabled
            case "4k":
                return planConfig.qualityProfiles.some((p) => p.name === "4K")
            default:
                return true
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Plan Information */}
            <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                    <strong>Current Plan:</strong> {planConfig?.name} - Features and quality profiles are configured based on your
                    subscription.
                </AlertDescription>
            </Alert>

            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Basic Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="name">Channel Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="My Live Stream"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Channel description..."
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Quality Profiles */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Quality Profiles
                        <Badge variant="outline">{planConfig?.name}</Badge>
                    </CardTitle>
                    <CardDescription>Video quality settings based on your {planConfig?.name} plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {formData.hlsSettings.qualityProfiles.map((profile, index) => (
                        <div key={profile.name} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-4">
                                <Switch
                                    checked={profile.enabled}
                                    onCheckedChange={(enabled) => updateQualityProfile(index, "enabled", enabled)}
                                />
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {profile.name}
                                        {profile.name === "4K" && !isFeatureAvailable("4k") && (
                                            <Badge variant="secondary">
                                                <Lock className="h-3 w-3 mr-1" />
                                                Enterprise Only
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {profile.resolution} • {profile.bitrate}kbps • {profile.fps}fps
                                    </div>
                                </div>
                            </div>
                            {profile.enabled && (
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={profile.bitrate}
                                        onChange={(e) => updateQualityProfile(index, "bitrate", Number.parseInt(e.target.value))}
                                        className="w-20"
                                        placeholder="Bitrate"
                                    />
                                    <Input
                                        type="number"
                                        value={profile.fps}
                                        onChange={(e) => updateQualityProfile(index, "fps", Number.parseInt(e.target.value))}
                                        className="w-16"
                                        placeholder="FPS"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* HLS Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        HLS Settings
                    </CardTitle>
                    <CardDescription>Configure streaming and recording settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="segmentLength">Segment Length (seconds)</Label>
                            <Input
                                id="segmentLength"
                                type="number"
                                value={formData.hlsSettings.segmentLength}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        hlsSettings: { ...formData.hlsSettings, segmentLength: Number.parseInt(e.target.value) },
                                    })
                                }
                                min={2}
                                max={10}
                            />
                        </div>
                        <div>
                            <Label htmlFor="dvrDuration">DVR Duration (minutes)</Label>
                            <Input
                                id="dvrDuration"
                                type="number"
                                value={formData.hlsSettings.dvrDuration}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        hlsSettings: { ...formData.hlsSettings, dvrDuration: Number.parseInt(e.target.value) },
                                    })
                                }
                                min={0}
                                max={planConfig?.hlsSettings.dvrDuration || 30}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Max: {planConfig?.hlsSettings.dvrDuration} minutes for {planConfig?.name} plan
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="flex items-center gap-2">
                                VTT Subtitles
                                {!isFeatureAvailable("vtt") && (
                                    <Badge variant="secondary">
                                        <Lock className="h-3 w-3 mr-1" />
                                        Pro+
                                    </Badge>
                                )}
                            </Label>
                            <p className="text-sm text-gray-500">Enable WebVTT subtitle support</p>
                        </div>
                        <Switch
                            checked={formData.hlsSettings.vttEnabled}
                            onCheckedChange={(enabled) =>
                                setFormData({
                                    ...formData,
                                    hlsSettings: { ...formData.hlsSettings, vttEnabled: enabled },
                                })
                            }
                            disabled={!isFeatureAvailable("vtt")}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Geo-locking */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Geo-locking
                        {!isFeatureAvailable("geoLocking") && (
                            <Badge variant="secondary">
                                <Lock className="h-3 w-3 mr-1" />
                                Pro+ Feature
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Restrict access based on geographic location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Enable Geo-locking</Label>
                        <Switch
                            checked={formData.hlsSettings.geoLocking.enabled}
                            onCheckedChange={(enabled) =>
                                setFormData({
                                    ...formData,
                                    hlsSettings: {
                                        ...formData.hlsSettings,
                                        geoLocking: { ...formData.hlsSettings.geoLocking, enabled },
                                    },
                                })
                            }
                            disabled={!isFeatureAvailable("geoLocking")}
                        />
                    </div>

                    {formData.hlsSettings.geoLocking.enabled && isFeatureAvailable("geoLocking") && (
                        <div className="space-y-4">
                            <div>
                                <Label>Allowed Countries</Label>
                                <div className="flex gap-2 mt-2">
                                    <Select value={newAllowedCountry} onValueChange={setNewAllowedCountry}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map((country) => (
                                                <SelectItem key={country} value={country}>
                                                    {country}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" onClick={() => addCountry("allowed")}>
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.hlsSettings.geoLocking.allowedCountries.map((country, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() => removeCountry("allowed", index)}
                                        >
                                            {country} ×
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label>Blocked Countries</Label>
                                <div className="flex gap-2 mt-2">
                                    <Select value={newBlockedCountry} onValueChange={setNewBlockedCountry}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map((country) => (
                                                <SelectItem key={country} value={country}>
                                                    {country}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" onClick={() => addCountry("blocked")}>
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.hlsSettings.geoLocking.blockedCountries.map((country, index) => (
                                        <Badge
                                            key={index}
                                            variant="destructive"
                                            className="cursor-pointer"
                                            onClick={() => removeCountry("blocked", index)}
                                        >
                                            {country} ×
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* IP Restrictions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        IP Restrictions
                        {!isFeatureAvailable("ipRestrictions") && (
                            <Badge variant="secondary">
                                <Lock className="h-3 w-3 mr-1" />
                                Pro+ Feature
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Control access based on IP addresses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Enable IP Restrictions</Label>
                        <Switch
                            checked={formData.hlsSettings.ipRestrictions.enabled}
                            onCheckedChange={(enabled) =>
                                setFormData({
                                    ...formData,
                                    hlsSettings: {
                                        ...formData.hlsSettings,
                                        ipRestrictions: { ...formData.hlsSettings.ipRestrictions, enabled },
                                    },
                                })
                            }
                            disabled={!isFeatureAvailable("ipRestrictions")}
                        />
                    </div>

                    {formData.hlsSettings.ipRestrictions.enabled && isFeatureAvailable("ipRestrictions") && (
                        <div className="space-y-4">
                            <div>
                                <Label>Allowed IPs</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        value={newAllowedIP}
                                        onChange={(e) => setNewAllowedIP(e.target.value)}
                                        placeholder="192.168.1.1 or 192.168.1.0/24"
                                        className="flex-1"
                                    />
                                    <Button type="button" onClick={() => addIP("allowed")}>
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.hlsSettings.ipRestrictions.allowedIPs.map((ip, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() => removeIP("allowed", index)}
                                        >
                                            {ip} ×
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label>Blocked IPs</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        value={newBlockedIP}
                                        onChange={(e) => setNewBlockedIP(e.target.value)}
                                        placeholder="192.168.1.1 or 192.168.1.0/24"
                                        className="flex-1"
                                    />
                                    <Button type="button" onClick={() => addIP("blocked")}>
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.hlsSettings.ipRestrictions.blockedIPs.map((ip, index) => (
                                        <Badge
                                            key={index}
                                            variant="destructive"
                                            className="cursor-pointer"
                                            onClick={() => removeIP("blocked", index)}
                                        >
                                            {ip} ×
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Catch-up TV */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tv className="h-5 w-5" />
                        Catch-up TV
                        {!isFeatureAvailable("catchupTv") && (
                            <Badge variant="secondary">
                                <Lock className="h-3 w-3 mr-1" />
                                Pro+ Feature
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Enable viewers to watch past content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Catch-up TV</Label>
                            <p className="text-sm text-gray-500">Allow viewers to watch previous broadcasts</p>
                        </div>
                        <Switch
                            checked={formData.hlsSettings.catchupTvEnabled}
                            onCheckedChange={(enabled) =>
                                setFormData({
                                    ...formData,
                                    hlsSettings: { ...formData.hlsSettings, catchupTvEnabled: enabled },
                                })
                            }
                            disabled={!isFeatureAvailable("catchupTv")}
                        />
                    </div>

                    {formData.hlsSettings.catchupTvEnabled && isFeatureAvailable("catchupTv") && (
                        <div>
                            <Label htmlFor="catchupDuration">Catch-up Duration (hours)</Label>
                            <Input
                                id="catchupDuration"
                                type="number"
                                value={formData.hlsSettings.catchupDuration}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        hlsSettings: { ...formData.hlsSettings, catchupDuration: Number.parseInt(e.target.value) },
                                    })
                                }
                                min={1}
                                max={planConfig?.hlsSettings.catchupDuration || 24}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Max: {planConfig?.hlsSettings.catchupDuration} hours for {planConfig?.name} plan
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                    <strong>Instance:</strong> c5.xlarge (4 vCPUs, 8GB RAM) • <strong>Storage:</strong> 25GB SSD •{" "}
                    <strong>OS:</strong> Ubuntu 22.04 LTS
                </AlertDescription>
            </Alert>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating Channel..." : "Create Channel"}
            </Button>
        </form>
    )
}
