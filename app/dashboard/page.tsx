"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Plus, Trash2, Eye, Copy, Server, Globe, Monitor, Cpu } from "lucide-react"
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { VideoPlayer } from "@/components/video-player"
import { TranscodingStatus } from "@/components/transcoding-status"

interface Channel {
  id: string
  name: string
  description: string
  status: "active" | "inactive" | "provisioning"
  instanceId?: string
  instanceType?: string
  publicIp?: string
  privateIp?: string
  hlsUrl?: string
  rtmpUrl?: string
  transcodingUrl?: string
  createdAt: Date
  viewerCount?: number
  isMock?: boolean
  services?: {
    transcoding?: boolean
    nginx?: boolean
    ffmpeg?: boolean
    transcodingStatus?: string
  }
}

export default function DashboardPage() {
  const { userData, user } = useAuth()
  const { toast } = useToast()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newChannel, setNewChannel] = useState({ name: "", description: "" })
  const [dialogOpen, setDialogOpen] = useState(false)

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

  const createChannel = async () => {
    if (!userData || !user || !newChannel.name.trim()) return

    // Check channel limit based on subscription
    const maxChannels = userData.subscription?.channels || 1
    if (channels.length >= maxChannels) {
      toast({
        title: "Channel Limit Reached",
        description: `Your ${userData.subscription?.plan} plan allows ${maxChannels} channel(s). Upgrade to create more.`,
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      // Create channel document first
      const channelData = {
        name: newChannel.name,
        description: newChannel.description,
        tenantId: userData.tenantId,
        status: "provisioning",
        createdAt: new Date(),
      }

      const docRef = await addDoc(collection(db, "channels"), channelData)

      // Get auth token for API call
      const token = await user.getIdToken()

      // Call API to provision c5.xlarge EC2 instance with transcoding
      const response = await fetch("/api/create-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ channelId: docRef.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to provision channel")
      }

      const result = await response.json()

      toast({
        title: "Channel Created",
        description: result.message || "Your c5.xlarge streaming instance has been provisioned successfully.",
      })

      setNewChannel({ name: "", description: "" })
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
    try {
      await deleteDoc(doc(db, "channels", channelId))
      toast({
        title: "Channel Deleted",
        description: "Channel has been successfully deleted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete channel.",
        variant: "destructive",
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
    return <div className="p-6">Loading channels...</div>
  }

  return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Channels</h1>
            <p className="text-gray-600">Manage your live streaming channels with transcoding</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Channel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Channel</DialogTitle>
                <DialogDescription>
                  Set up a new live streaming channel. A c5.xlarge EC2 instance with transcoding service will be
                  provisioned automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Channel Name</Label>
                  <Input
                      id="name"
                      value={newChannel.name}
                      onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                      placeholder="My Live Stream"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                      id="description"
                      value={newChannel.description}
                      onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                      placeholder="Channel description..."
                  />
                </div>
                <Alert>
                  <Cpu className="h-4 w-4" />
                  <AlertDescription>
                    This will create a <strong>c5.xlarge</strong> instance (4 vCPUs, 8 GB RAM) with Node.js transcoding
                    service.
                  </AlertDescription>
                </Alert>
                <Button onClick={createChannel} disabled={creating} className="w-full">
                  {creating ? "Creating c5.xlarge Instance..." : "Create Channel"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
                        </CardTitle>
                        <CardDescription>{channel.description}</CardDescription>
                      </div>
                      <Badge variant={channel.status === "active" ? "default" : "secondary"}>{channel.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Instance Information */}
                    {channel.instanceId && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            <Label className="text-sm font-medium">Instance Details</Label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="font-mono bg-gray-100 p-2 rounded">
                              <strong>ID:</strong> {channel.instanceId}
                            </div>
                            <div className="font-mono bg-gray-100 p-2 rounded">
                              <strong>Type:</strong> {channel.instanceType || "c5.xlarge"}
                            </div>
                          </div>
                          {channel.publicIp && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-3 w-3" />
                                <span className="text-xs">
                          <strong>Public IP:</strong> {channel.publicIp}
                        </span>
                              </div>
                          )}
                          {channel.privateIp && (
                              <div className="flex items-center gap-2">
                                <Monitor className="h-3 w-3" />
                                <span className="text-xs">
                          <strong>Private IP:</strong> {channel.privateIp}
                        </span>
                              </div>
                          )}
                        </div>
                    )}

                    {/* Streaming URLs */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {channel.hlsUrl && (
                          <div>
                            <Label className="text-sm font-medium">HLS URL</Label>
                            <div className="flex items-center gap-2">
                              <Input value={channel.hlsUrl} readOnly className="text-xs" />
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(channel.hlsUrl!)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                      )}

                      {channel.rtmpUrl && (
                          <div>
                            <Label className="text-sm font-medium">RTMP Ingest</Label>
                            <div className="flex items-center gap-2">
                              <Input value={channel.rtmpUrl} readOnly className="text-xs" />
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
                      <Button size="sm" variant="outline" className="flex-1">
                        View Stream
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteChannel(channel.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Transcoding Service Status */}
                {channel.status === "active" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <TranscodingStatus
                          channelId={channel.id}
                          publicIp={channel.publicIp}
                          transcodingUrl={channel.transcodingUrl}
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
                  Create your first streaming channel with c5.xlarge instance and transcoding service.
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
