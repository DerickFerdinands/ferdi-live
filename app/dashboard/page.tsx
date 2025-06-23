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
import { Play, Plus, Trash2, Eye, Copy } from "lucide-react"
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

interface Channel {
  id: string
  name: string
  description: string
  status: "active" | "inactive" | "provisioning"
  instanceId?: string
  hlsUrl?: string
  rtmpUrl?: string
  createdAt: Date
  viewerCount?: number
}

export default function DashboardPage() {
  const { userData } = useAuth()
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
    if (!userData || !newChannel.name.trim()) return

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
      // Create channel document
      const channelData = {
        name: newChannel.name,
        description: newChannel.description,
        tenantId: userData.tenantId,
        status: "provisioning",
        createdAt: new Date(),
      }

      const docRef = await addDoc(collection(db, "channels"), channelData)

      // Call API to provision EC2 instance
      const response = await fetch("/api/create-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: docRef.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to provision channel")
      }

      toast({
        title: "Channel Created",
        description: "Your streaming channel is being provisioned.",
      })

      setNewChannel({ name: "", description: "" })
      setDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create channel. Please try again.",
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
          <p className="text-gray-600">Manage your live streaming channels</p>
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
                Set up a new live streaming channel. An EC2 instance will be provisioned automatically.
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
              <Button onClick={createChannel} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Channel"}
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <Card key={channel.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {channel.name}
                  </CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </div>
                <Badge variant={channel.status === "active" ? "default" : "secondary"}>{channel.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
        ))}
      </div>

      {channels.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Play className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No channels yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first streaming channel to get started with live broadcasting.
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
