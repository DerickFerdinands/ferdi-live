"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { Eye, Users, Clock, TrendingUp, Download } from "lucide-react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { ref, onValue } from "firebase/database"
import { db, realtimeDb } from "@/lib/firebase"

interface AnalyticsData {
  channelId: string
  channelName: string
  viewerCount: number
  peakViewers: number
  totalViews: number
  uptime: number
  geoDistribution: Record<string, number>
  qualityDistribution: Record<string, number>
  deviceTypes: Record<string, number>
  watchTime: number
  bounceRate: number
  engagement: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export default function AnalyticsPage() {
  const { userData } = useAuth()
  const [channels, setChannels] = useState<any[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>("")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [realtimeData, setRealtimeData] = useState<Record<string, any>>({})
  const [timeRange, setTimeRange] = useState("24h")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userData) return

    // Fetch channels
    const channelsQuery = query(collection(db, "channels"), where("tenantId", "==", userData.tenantId))

    const unsubscribeChannels = onSnapshot(channelsQuery, (snapshot) => {
      const channelData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setChannels(channelData)
      if (channelData.length > 0 && !selectedChannel) {
        setSelectedChannel(channelData[0].id)
      }
      setLoading(false)
    })

    return () => unsubscribeChannels()
  }, [userData, selectedChannel])

  useEffect(() => {
    if (!userData || channels.length === 0) return

    // Fetch analytics data
    const analyticsQuery = query(
        collection(db, "analytics"),
        where(
            "channelId",
            "in",
            channels.map((c) => c.id),
        ),
    )

    const unsubscribeAnalytics = onSnapshot(analyticsQuery, (snapshot) => {
      const analytics = snapshot.docs.map((doc) => {
        const data = doc.data()
        const channel = channels.find((c) => c.id === data.channelId)
        return {
          channelId: data.channelId,
          channelName: channel?.name || "Unknown",
          viewerCount: data.viewerCount || 0,
          peakViewers: data.peakViewers || 0,
          totalViews: data.totalViews || 0,
          uptime: data.uptime || 0,
          geoDistribution: data.geoDistribution || {},
          qualityDistribution: data.qualityDistribution || {
            "1080p": 45,
            "720p": 35,
            "480p": 20,
          },
          deviceTypes: data.deviceTypes || {
            Desktop: 60,
            Mobile: 30,
            Tablet: 10,
          },
          watchTime: data.watchTime || 0,
          bounceRate: data.bounceRate || 15,
          engagement: data.engagement || 85,
        }
      })
      setAnalyticsData(analytics)
    })

    // Listen to real-time viewer data
    channels.forEach((channel) => {
      const realtimeRef = ref(realtimeDb, `streams/${channel.id}/viewers`)
      onValue(realtimeRef, (snapshot) => {
        const data = snapshot.val()
        setRealtimeData((prev) => ({
          ...prev,
          [channel.id]: data || { count: 0, locations: {} },
        }))
      })
    })

    return () => unsubscribeAnalytics()
  }, [userData, channels])

  const selectedChannelData = analyticsData.find((a) => a.channelId === selectedChannel)
  const selectedRealtimeData = realtimeData[selectedChannel] || { count: 0, locations: {} }

  // Mock data for charts
  const viewerHistory = [
    { time: "00:00", viewers: 45, engagement: 78 },
    { time: "04:00", viewers: 32, engagement: 65 },
    { time: "08:00", viewers: 78, engagement: 82 },
    { time: "12:00", viewers: 156, engagement: 89 },
    { time: "16:00", viewers: 234, engagement: 92 },
    { time: "20:00", viewers: 189, engagement: 85 },
  ]

  const qualityData = selectedChannelData
      ? Object.entries(selectedChannelData.qualityDistribution).map(([quality, percentage]) => ({
        name: quality,
        value: percentage,
      }))
      : []

  const deviceData = selectedChannelData
      ? Object.entries(selectedChannelData.deviceTypes).map(([device, percentage]) => ({
        name: device,
        value: percentage,
      }))
      : []

  const geoData = Object.entries(selectedRealtimeData.locations || {}).map(([country, count]) => ({
    name: country,
    value: count as number,
  }))

  const exportData = () => {
    const data = {
      channel: selectedChannelData?.channelName,
      timeRange,
      exportedAt: new Date().toISOString(),
      metrics: selectedChannelData,
      viewerHistory,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${selectedChannelData?.channelName}-${timeRange}.json`
    a.click()
  }

  if (loading) {
    return (
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600">Monitor your streaming performance and audience insights</p>
          </div>

          <div className="flex gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            {channels.length > 0 && (
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            )}

            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {selectedChannelData && (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Viewers</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedRealtimeData.count}</div>
                    <p className="text-xs text-muted-foreground">
                      Peak: {selectedChannelData.peakViewers} • +12% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedChannelData.totalViews.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+5.2% from last period</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(selectedChannelData.watchTime)}h</div>
                    <p className="text-xs text-muted-foreground">Avg: 45min per viewer</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedChannelData.engagement}%</div>
                    <p className="text-xs text-muted-foreground">Bounce rate: {selectedChannelData.bounceRate}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Viewer Trends</CardTitle>
                    <CardDescription>Concurrent viewers and engagement over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={viewerHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="viewers" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="engagement" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quality Distribution</CardTitle>
                    <CardDescription>Viewer preferences by video quality</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                            data={qualityData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                          {qualityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Device Types</CardTitle>
                    <CardDescription>Viewer distribution by device</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={deviceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>Viewers by country</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {geoData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                                data={geoData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                              {geoData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                          No geographic data available
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Metrics */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Buffer Rate</span>
                      <span className="text-sm">2.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Startup Time</span>
                      <span className="text-sm">1.2s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm">0.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Bitrate</span>
                      <span className="text-sm">4.5 Mbps</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Audience Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">New Viewers</span>
                      <span className="text-sm">68%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Returning Viewers</span>
                      <span className="text-sm">32%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Avg. Session</span>
                      <span className="text-sm">45min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Peak Hour</span>
                      <span className="text-sm">8-9 PM</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Impact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">CPM</span>
                      <span className="text-sm">$2.45</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Revenue/Hour</span>
                      <span className="text-sm">$12.30</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total Revenue</span>
                      <span className="text-sm">$156.80</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <span className="text-sm">3.2%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
        )}

        {channels.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No analytics data</h3>
                <p className="text-gray-600 text-center">Create a channel and start streaming to see analytics data.</p>
              </CardContent>
            </Card>
        )}
      </div>
  )
}
