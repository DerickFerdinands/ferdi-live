"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Play, Server, DollarSign, Eye, Trash2, Search, Download, AlertTriangle, TrendingUp } from "lucide-react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

interface AdminStats {
  totalTenants: number
  totalChannels: number
  activeStreams: number
  totalRevenue: number
  monthlyGrowth: number
  systemHealth: number
}

interface TenantData {
  id: string
  email: string
  plan: string
  status: string
  channels: number
  createdAt: Date
  lastActive: Date
  revenue: number
  streamingHours: number
}

interface ChannelData {
  id: string
  name: string
  tenantEmail: string
  status: string
  instanceId?: string
  viewerCount: number
  createdAt: Date
  region: string
  cost: number
}

interface SystemMetric {
  name: string
  value: string
  status: "healthy" | "warning" | "critical"
  trend: "up" | "down" | "stable"
}

export default function AdminPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<AdminStats>({
    totalTenants: 0,
    totalChannels: 0,
    activeStreams: 0,
    totalRevenue: 0,
    monthlyGrowth: 15.2,
    systemHealth: 98.5,
  })
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [channels, setChannels] = useState<ChannelData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    { name: "CPU Usage", value: "45%", status: "healthy", trend: "stable" },
    { name: "Memory Usage", value: "67%", status: "warning", trend: "up" },
    { name: "Disk Usage", value: "23%", status: "healthy", trend: "down" },
    { name: "Network I/O", value: "156 MB/s", status: "healthy", trend: "up" },
    { name: "Active Instances", value: "12", status: "healthy", trend: "stable" },
    { name: "Error Rate", value: "0.02%", status: "healthy", trend: "down" },
  ])

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
        revenue: Math.floor(Math.random() * 500) + 50, // Mock revenue
        streamingHours: Math.floor(Math.random() * 100) + 10, // Mock hours
      })) as TenantData[]

      setTenants(tenantData)
      setStats((prev) => ({
        ...prev,
        totalTenants: tenantData.length,
        totalRevenue: tenantData.reduce((sum, tenant) => sum + tenant.revenue, 0),
      }))
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
              region: data.region || "us-east-1",
              cost: Math.floor(Math.random() * 50) + 10, // Mock cost
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

  const exportData = (type: "tenants" | "channels") => {
    const data = type === "tenants" ? tenants : channels
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}-export-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = tenant.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || tenant.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const filteredChannels = channels.filter((channel) => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || channel.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">System overview and management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportData("tenants")}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
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
              <p className="text-xs text-muted-foreground">+{stats.monthlyGrowth}% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Streams</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeStreams}</div>
              <p className="text-xs text-muted-foreground">{stats.totalChannels} total channels</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.systemHealth}%</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tenants" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tenant Management</CardTitle>
                    <CardDescription>Manage user accounts and subscriptions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Search tenants..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-64"
                      />
                    </div>
                    <Button variant="outline" onClick={() => exportData("tenants")}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.slice(0, 20).map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">{tenant.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{tenant.plan}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tenant.status === "active" ? "default" : "secondary"}>{tenant.status}</Badge>
                          </TableCell>
                          <TableCell>{tenant.channels}</TableCell>
                          <TableCell>${tenant.revenue}</TableCell>
                          <TableCell>{tenant.streamingHours}h</TableCell>
                          <TableCell>{tenant.createdAt.toLocaleDateString()}</TableCell>
                          <TableCell>{tenant.lastActive.toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Channel Management</CardTitle>
                    <CardDescription>Monitor and manage streaming channels</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Search channels..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-64"
                      />
                    </div>
                    <Button variant="outline" onClick={() => exportData("channels")}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Viewers</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Instance ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChannels.map((channel) => (
                        <TableRow key={channel.id}>
                          <TableCell className="font-medium">{channel.name}</TableCell>
                          <TableCell>{channel.tenantEmail}</TableCell>
                          <TableCell>
                            <Badge variant={channel.status === "active" ? "default" : "secondary"}>{channel.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {channel.viewerCount}
                            </div>
                          </TableCell>
                          <TableCell>{channel.region}</TableCell>
                          <TableCell>${channel.cost}/hr</TableCell>
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
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                  <CardDescription>Real-time system performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                              className={`w-2 h-2 rounded-full ${
                                  metric.status === "healthy"
                                      ? "bg-green-500"
                                      : metric.status === "warning"
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                              }`}
                          />
                          <span className="text-sm font-medium">{metric.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{metric.value}</span>
                          <TrendingUp
                              className={`h-3 w-3 ${
                                  metric.trend === "up"
                                      ? "text-green-500"
                                      : metric.trend === "down"
                                          ? "text-red-500"
                                          : "text-gray-500"
                              }`}
                          />
                        </div>
                      </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Recent system notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> Memory usage is above 65% on server us-east-1-prod-02
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>Info:</strong> Scheduled maintenance window: March 15, 2024 2:00-4:00 AM UTC
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>Success:</strong> All systems are operating normally
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">MRR</span>
                    <span className="text-sm">${stats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">ARPU</span>
                    <span className="text-sm">${Math.round(stats.totalRevenue / stats.totalTenants)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Churn Rate</span>
                    <span className="text-sm">2.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Growth Rate</span>
                    <span className="text-sm">+{stats.monthlyGrowth}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Streams</span>
                    <span className="text-sm">{stats.totalChannels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Active Now</span>
                    <span className="text-sm">{stats.activeStreams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Peak Concurrent</span>
                    <span className="text-sm">45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Avg Duration</span>
                    <span className="text-sm">2.5h</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Active Instances</span>
                    <span className="text-sm">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Cost</span>
                    <span className="text-sm">$1,245/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Efficiency</span>
                    <span className="text-sm">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm">99.9%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  )
}
