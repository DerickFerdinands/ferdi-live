"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Play,
  Plus,
  Trash2,
  Eye,
  Copy,
  Server,
  Globe,
  Settings,
  Video,
  Shield,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { VideoPlayer } from "@/components/video-player"
import { TranscodingStatus } from "@/components/transcoding-status"
import { ChannelCreationForm } from "@/components/channel-creation-form"
import { ProgramSchedule } from "@/components/program-schedule"
import Link from "next/link"
import { FeatureGate } from "@/components/feature-gate"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { SubscriptionStatus } from "@/components/subscription-status"
import { STRIPE_PLANS } from "@/lib/stripe"

interface Channel {
  id: string
  name: string
  description: string
  status: "active" | "inactive" | "provisioning"
  instanceId?: string
  instanceType?: string
  storage?: string
  os?: string
  publicIp?: string
  privateIp?: string
  hlsUrl?: string
  rtmpUrl?: string
  transcodingUrl?: string
  healthCheckUrl?: string
  createdAt: Date
  viewerCount?: number
  isMock?: boolean
  hlsSettings?: {
    qualityProfiles: Array<{
      name: string
      resolution: string
      bitrate: number
      fps: number
      enabled: boolean
    }>
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
  services?: {
    transcoding?: boolean
    nginx?: boolean
    ffmpeg?: boolean
    statusServer?: boolean
    transcodingStatus?: string
  }
  securityGroup?: {
    ports: number[]
    source: string
  }
}

export default function DashboardPage() {
  const { userData, user } = useAuth()
  const { toast } = useToast()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingChannels, setDeletingChannels] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userData) return

    const q = query(collection(db, "channels"), where("tenantId", "==", userData.tenantId))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Channel[]

      setChannels(channelData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userData])

  const createChannel = async (formData: any) => {
    if (!userData || !user) return

    // Check channel limit based on subscription
    const maxChannels = userData.subscription?.channels || 1
    if (channels.length >= maxChannels) {
      toast({
        title: "Channel Limit Reached",
        description: `Your ${userData.subscription?.plan || "Basic"} plan allows ${maxChannels} channel(s). Upgrade to create more.`,
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      // Validate HLS settings against user's plan
      const userPlan = userData.subscription?.plan || "basic"
      const planConfig = STRIPE_PLANS[userPlan as keyof typeof STRIPE_PLANS]

      // Filter out features not available in current plan
      const validatedHlsSettings = {
        ...formData.hlsSettings,
        geoLocking: {
          ...formData.hlsSettings.geoLocking,
          enabled: formData.hlsSettings.geoLocking.enabled && planConfig.hlsSettings.geoLocking.enabled,
        },
        ipRestrictions: {
          ...formData.hlsSettings.ipRestrictions,
          enabled: formData.hlsSettings.ipRestrictions.enabled && planConfig.hlsSettings.ipRestrictions.enabled,
        },
        catchupTvEnabled: formData.hlsSettings.catchupTvEnabled && planConfig.hlsSettings.catchupTvEnabled,
        vttEnabled: formData.hlsSettings.vttEnabled && planConfig.hlsSettings.vttEnabled,
        qualityProfiles: formData.hlsSettings.qualityProfiles.filter((profile: any) => {
          if (profile.name === "4K") {
            return planConfig.qualityProfiles.some((p) => p.name === "4K")
          }
          return true
        }),
      }

      // Create channel document first
      const channelData = {
        name: formData.name,
        description: formData.description,
        tenantId: userData.tenantId,
        status: "provisioning",
        hlsSettings: validatedHlsSettings,
        createdAt: new Date(),
      }

      const docRef = await addDoc(collection(db, "channels"), channelData)

      // Get auth token for API call
      const token = await user.getIdToken()

      // Call API to provision c5.xlarge Ubuntu EC2 instance with transcoding
      const response = await fetch("/api/create-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelId: docRef.id,
          hlsSettings: validatedHlsSettings,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to provision channel")
      }

      const result = await response.json()

      toast({
        title: "Channel Created",
        description: result.message || "Your Ferdi Live streaming instance has been provisioned successfully.",
      })

      setDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create channel. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const deleteChannel = async (channelId: string) => {
    if (!user) return

    setDeletingChannels((prev) => new Set(prev).add(channelId))

    try {
      const token = await user.getIdToken()

      const response = await fetch("/api/delete-channel", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ channelId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete channel")
      }

      const result = await response.json()

      toast({
        title: "Channel Deleted",
        description: result.message,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete channel.",
        variant: "destructive",
      })
    } finally {
      setDeletingChannels((prev) => {
        const newSet = new Set(prev)
        newSet.delete(channelId)
        return newSet
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "URL copied to clipboard.",
    })
  }

  if (loading) {
    return (
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading channels...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Channels</h1>
            <p className="text-gray-600">Manage your Ferdi Live streaming channels</p>
          </div>

          <FeatureGate
              feature="multipleChannels"
              requiredPlan="pro"
              fallback={
                channels.length >= (userData?.subscription?.channels || 1) ? (
                    <UpgradePrompt
                        currentPlan={userData?.subscription?.plan || "basic"}
                        requiredPlan="pro"
                        feature="Additional Channels"
                    />
                ) : (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Channel
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Create New Channel</DialogTitle>
                          <DialogDescription>
                            Configure your live streaming channel with advanced HLS settings, quality profiles, and security
                            options.
                          </DialogDescription>
                        </DialogHeader>
                        <ChannelCreationForm onSubmit={createChannel} loading={creating} />
                      </DialogContent>
                    </Dialog>
                )
              }
          >
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Channel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create New Channel</DialogTitle>
                  <DialogDescription>
                    Configure your live streaming channel with advanced HLS settings, quality profiles, and security
                    options.
                  </DialogDescription>
                </DialogHeader>
                <ChannelCreationForm onSubmit={createChannel} loading={creating} />
              </DialogContent>
            </Dialog>
          </FeatureGate>
        </div>

        {userData?.subscription && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <SubscriptionStatus />
              </div>
            </div>
        )}

        {userData?.subscription && (
            <Alert>
              <AlertDescription>
                You're on the <strong>{userData.subscription.plan}</strong> plan with {channels.length}/
                {userData.subscription.channels} channels used.
              </AlertDescription>
            </Alert>
        )}

        <div className="grid gap-6">
          {channels.map((channel) => (
              <div key={channel.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Play className="h-5 w-5" />
                          {channel.name}
                          {channel.isMock && <Badge variant="outline">Demo</Badge>}
                          {channel.instanceType && <Badge variant="secondary">{channel.instanceType}</Badge>}
                          {channel.os && <Badge variant="outline">{channel.os}</Badge>}
                          {channel.hlsSettings?.catchupTvEnabled && (
                              <Badge variant="default" className="bg-purple-600">
                                <Calendar className="h-3 w-3 mr-1" />
                                Catch-up TV
                              </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{channel.description}</CardDescription>
                      </div>
                      <Badge variant={channel.status === "active" ? "default" : "secondary"}>{channel.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* HLS Settings Summary */}
                    {channel.hlsSettings && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <Video className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                            <div className="text-xs font-medium">Quality Profiles</div>
                            <div className="text-xs text-gray-500">
                              {channel.hlsSettings.qualityProfiles.filter((p) => p.enabled).length} enabled
                            </div>
                          </div>
                          <div className="text-center">
                            <Settings className="h-4 w-4 mx-auto mb-1 text-green-600" />
                            <div className="text-xs font-medium">DVR</div>
                            <div className="text-xs text-gray-500">{channel.hlsSettings.dvrDuration}min</div>
                          </div>
                          <div className="text-center">
                            <Globe className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                            <div className="text-xs font-medium">Geo-lock</div>
                            <div className="text-xs text-gray-500">
                              {channel.hlsSettings.geoLocking.enabled ? "Enabled" : "Disabled"}
                            </div>
                          </div>
                          <div className="text-center">
                            <Shield className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                            <div className="text-xs font-medium">IP Restrict</div>
                            <div className="text-xs text-gray-500">
                              {channel.hlsSettings.ipRestrictions.enabled ? "Enabled" : "Disabled"}
                            </div>
                          </div>
                        </div>
                    )}

                    {/* Instance Information */}
                    {channel.instanceId && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            <span className="text-sm font-medium">Instance Details</span>
                          </div>

                          <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                            <strong>Instance ID:</strong> {channel.instanceId}
                          </div>

                          {channel.publicIp && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-3 w-3" />
                                <span className="text-xs">
                          <strong>Public IP:</strong> {channel.publicIp}
                        </span>
                              </div>
                          )}
                        </div>
                    )}

                    {/* Streaming URLs */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {channel.hlsUrl && (
                          <div>
                            <label className="text-sm font-medium">HLS URL</label>
                            <div className="flex items-center gap-2">
                              <input value={channel.hlsUrl} readOnly className="flex-1 text-xs p-2 border rounded" />
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(channel.hlsUrl!)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                      )}

                      {channel.rtmpUrl && (
                          <div>
                            <label className="text-sm font-medium">RTMP Ingest</label>
                            <div className="flex items-center gap-2">
                              <input value={channel.rtmpUrl} readOnly className="flex-1 text-xs p-2 border rounded" />
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(channel.rtmpUrl!)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                      )}
                    </div>

                    {channel.viewerCount !== undefined && (
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">{channel.viewerCount} viewers</span>
                        </div>
                    )}

                    <div className="flex gap-2">
                      {channel.status === "active" && channel.hlsUrl && (
                          <Link href={`/stream/${channel.id}`} target="_blank">
                            <Button size="sm" variant="outline" className="flex-1">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              View Stream
                            </Button>
                          </Link>
                      )}
                      <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteChannel(channel.id)}
                          disabled={deletingChannels.has(channel.id)}
                      >
                        {deletingChannels.has(channel.id) ? "Deleting..." : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Program Schedule for Catch-up TV */}
                {channel.status === "active" && channel.hlsSettings?.catchupTvEnabled && (
                    <ProgramSchedule channelId={channel.id} channelName={channel.name} />
                )}

                {/* Transcoding Service Status */}
                {channel.status === "active" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <TranscodingStatus
                          channelId={channel.id}
                          publicIp={channel.publicIp}
                          transcodingUrl={channel.transcodingUrl}
                          healthCheckUrl={channel.healthCheckUrl}
                          instanceType={channel.instanceType}
                          storage={channel.storage}
                          os={channel.os}
                          services={channel.services}
                      />

                      {/* Video Preview */}
                      {channel.hlsUrl && <VideoPlayer hlsUrl={channel.hlsUrl} title={`${channel.name} - Live Preview`} />}
                    </div>
                )}
              </div>
          ))}
        </div>

        {channels.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Play className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No channels yet</h3>
                <p className="text-gray-600 text-center mb-4">
                  Create your first Ferdi Live streaming channel with advanced HLS settings and quality profiles.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Channel
                </Button>
              </CardContent>
            </Card>
        )}
      </div>
  )
}
