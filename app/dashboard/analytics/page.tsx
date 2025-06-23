"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Eye, Users, Clock, Globe } from "lucide-react"
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
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AnalyticsPage() {
  const { userData } = useAuth()
  const [channels, setChannels] = useState<any[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>("")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [realtimeData, setRealtimeData] = useState<Record<string, any>>({})

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
    { time: "00:00", viewers: 45 },
    { time: "04:00", viewers: 32 },
    { time: "08:00", viewers: 78 },
    { time: "12:00", viewers: 156 },
    { time: "16:00", viewers: 234 },
    { time: "20:00", viewers: 189 },
  ]

  const geoData = Object.entries(selectedRealtimeData.locations || {}).map(([country, count]) => ({
    name: country,
    value: count as number,
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600">Monitor your streaming performance</p>
        </div>

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
                <p className="text-xs text-muted-foreground">Peak: {selectedChannelData.peakViewers}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedChannelData.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time views</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(selectedChannelData.uptime)}h</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Countries</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(selectedRealtimeData.locations || {}).length}</div>
                <p className="text-xs text-muted-foreground">Viewer locations</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Viewer History (24h)</CardTitle>
                <CardDescription>Concurrent viewers over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewerHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="viewers" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
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

          {/* Stream Status */}
          <Card>
            <CardHeader>
              <CardTitle>Stream Status</CardTitle>
              <CardDescription>Current streaming information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default">Live</Badge>
                    <span className="text-sm text-gray-600">Broadcasting</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quality</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">1080p</Badge>
                    <span className="text-sm text-gray-600">60 FPS</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bitrate</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium">4.5 Mbps</span>
                    <span className="text-sm text-gray-600">Stable</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
