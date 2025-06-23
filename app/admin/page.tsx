"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Play, Server, DollarSign, Eye, Trash2 } from "lucide-react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

interface AdminStats {
  totalTenants: number
  totalChannels: number
  activeStreams: number
  totalRevenue: number
}

interface TenantData {
  id: string
  email: string
  plan: string
  status: string
  channels: number
  createdAt: Date
  lastActive: Date
}

interface ChannelData {
  id: string
  name: string
  tenantEmail: string
  status: string
  instanceId?: string
  viewerCount: number
  createdAt: Date
}

export default function AdminPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<AdminStats>({
    totalTenants: 0,
    totalChannels: 0,
    activeStreams: 0,
    totalRevenue: 0,
  })
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [channels, setChannels] = useState<ChannelData[]>([])

  useEffect(() => {
    // Fetch tenants
    const tenantsQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))
    const unsubscribeTenants = onSnapshot(tenantsQuery, (snapshot) => {
      const tenantData = snapshot.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email,
        plan: doc.data().subscription?.plan || "basic",
        status: doc.data().subscription?.status || "trial",
        channels: doc.data().subscription?.channels || 1,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastActive: doc.data().lastActive?.toDate() || new Date(),
      })) as TenantData[]

      setTenants(tenantData)
      setStats((prev) => ({ ...prev, totalTenants: tenantData.length }))
    })

    // Fetch channels
    const channelsQuery = query(collection(db, "channels"), orderBy("createdAt", "desc"))
    const unsubscribeChannels = onSnapshot(channelsQuery, async (snapshot) => {
      const channelData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data()
          // Get tenant email
          const tenantDoc = await db.collection("users").doc(data.tenantId).get()
          const tenantEmail = tenantDoc.exists() ? tenantDoc.data()?.email : "Unknown"

          return {
            id: doc.id,
            name: data.name,
            tenantEmail,
            status: data.status,
            instanceId: data.instanceId,
            viewerCount: data.viewerCount || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
          }
        }),
      )

      setChannels(channelData as ChannelData[])
      setStats((prev) => ({
        ...prev,
        totalChannels: channelData.length,
        activeStreams: channelData.filter((c) => c.status === "active").length,
      }))
    })

    return () => {
      unsubscribeTenants()
      unsubscribeChannels()
    }
  }, [])

  const terminateStream = async (channelId: string, instanceId?: string) => {
    try {
      const response = await fetch("/api/admin/terminate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, instanceId }),
      })

      if (response.ok) {
        toast({
          title: "Stream Terminated",
          description: "The stream has been successfully terminated.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to terminate stream.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChannels}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streams</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStreams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tenants</CardTitle>
          <CardDescription>Latest registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.slice(0, 10).map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tenant.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenant.status === "active" ? "default" : "secondary"}>{tenant.status}</Badge>
                  </TableCell>
                  <TableCell>{tenant.channels}</TableCell>
                  <TableCell>{tenant.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Active Streams */}
      <Card>
        <CardHeader>
          <CardTitle>Active Streams</CardTitle>
          <CardDescription>Currently running streams</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Viewers</TableHead>
                <TableHead>Instance ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels
                .filter((c) => c.status === "active")
                .map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="font-medium">{channel.name}</TableCell>
                    <TableCell>{channel.tenantEmail}</TableCell>
                    <TableCell>
                      <Badge variant="default">{channel.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {channel.viewerCount}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{channel.instanceId}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => terminateStream(channel.id, channel.instanceId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
