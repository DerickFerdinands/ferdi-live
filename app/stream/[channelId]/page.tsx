"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EnhancedVideoPlayer } from "@/components/enhanced-video-player"
import { ArrowLeft, Eye, Clock, Share2, Maximize, Users, Signal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Channel {
    id: string
    name: string
    description: string
    status: string
    hlsUrl?: string
    viewerCount?: number
    createdAt: Date
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
}

interface EPGProgram {
    id: string
    title: string
    description: string
    startTime: Date
    endTime: Date
    category: string
    isLive?: boolean
}

export default function StreamPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const [channel, setChannel] = useState<Channel | null>(null)
    const [epgData, setEPGData] = useState<EPGProgram[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [viewerCount, setViewerCount] = useState(0)

    const channelId = params.channelId as string

    useEffect(() => {
        const fetchChannel = async () => {
            try {
                const channelDoc = await getDoc(doc(db, "channels", channelId))

                if (!channelDoc.exists()) {
                    setError("Channel not found")
                    return
                }

                const channelData = {
                    id: channelDoc.id,
                    ...channelDoc.data(),
                    createdAt: channelDoc.data().createdAt?.toDate() || new Date(),
                } as Channel

                if (channelData.status !== "active") {
                    setError("This channel is not currently streaming")
                    return
                }

                if (!channelData.hlsUrl) {
                    setError("Stream URL not available")
                    return
                }

                setChannel(channelData)
                setViewerCount(channelData.viewerCount || Math.floor(Math.random() * 500) + 50)
            } catch (error) {
                console.error("Error fetching channel:", error)
                setError("Failed to load channel")
            } finally {
                setLoading(false)
            }
        }

        if (channelId) {
            fetchChannel()
        }
    }, [channelId])

    useEffect(() => {
        if (!channel) return

        // Fetch EPG data if catch-up TV is enabled
        if (channel.hlsSettings?.catchupTvEnabled) {
            const epgQuery = query(collection(db, "programSchedules"), where("liveChannelId", "==", channelId))

            const unsubscribe = onSnapshot(epgQuery, (snapshot) => {
                const programs = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    title: doc.data().title,
                    description: doc.data().description || "",
                    startTime: doc.data().startTime?.toDate() || new Date(),
                    endTime: doc.data().endTime?.toDate() || new Date(),
                    category: doc.data().category || "General",
                    isLive: false,
                })) as EPGProgram[]

                // Mark current program as live
                const now = new Date()
                const updatedPrograms = programs.map((program) => ({
                    ...program,
                    isLive: now >= program.startTime && now <= program.endTime,
                }))

                setEPGData(updatedPrograms)
            })

            return () => unsubscribe()
        }
    }, [channel, channelId])

    // Simulate viewer count updates
    useEffect(() => {
        const interval = setInterval(() => {
            setViewerCount((prev) => {
                const change = Math.floor(Math.random() * 10) - 5 // -5 to +5
                return Math.max(0, prev + change)
            })
        }, 10000) // Update every 10 seconds

        return () => clearInterval(interval)
    }, [])

    const shareStream = async () => {
        const url = window.location.href
        try {
            await navigator.clipboard.writeText(url)
            toast({
                title: "Link Copied",
                description: "Stream link has been copied to clipboard.",
            })
        } catch (error) {
            toast({
                title: "Share",
                description: `Share this stream: ${url}`,
            })
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading stream...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Stream Unavailable</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <Button onClick={() => router.back()} className="w-full">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!channel) {
        return null
    }

    return (
        <div className={`min-h-screen bg-black ${isFullscreen ? "p-0" : "p-4"}`}>
            {/* Fullscreen Video Player */}
            {isFullscreen ? (
                <div className="w-full h-screen relative">
                    <EnhancedVideoPlayer
                        hlsUrl={channel.hlsUrl!}
                        title={channel.name}
                        autoplay={true}
                        qualityProfiles={channel.hlsSettings?.qualityProfiles}
                        epgData={epgData}
                        showControls={true}
                    />
                    <div className="absolute top-4 right-4 z-50">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                        >
                            Exit Fullscreen
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={shareStream}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                            <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
                                <Maximize className="h-4 w-4 mr-2" />
                                Fullscreen
                            </Button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid gap-6 lg:grid-cols-4">
                        {/* Video Player */}
                        <div className="lg:col-span-3">
                            <EnhancedVideoPlayer
                                hlsUrl={channel.hlsUrl!}
                                title={channel.name}
                                autoplay={true}
                                qualityProfiles={channel.hlsSettings?.qualityProfiles}
                                epgData={epgData}
                                showControls={true}
                            />

                            {/* Stream Info */}
                            <Card className="mt-4 bg-gray-900 border-gray-700 text-white">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl">{channel.name}</CardTitle>
                                            <CardDescription className="text-gray-300">{channel.description}</CardDescription>
                                        </div>
                                        <Badge className="bg-red-600">
                                            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                            LIVE
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-6 text-sm text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <Eye className="h-4 w-4" />
                                            {viewerCount} viewers
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            Started {channel.createdAt.toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Signal className="h-4 w-4" />
                                            HD Quality
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            {/* Live Stats */}
                            <Card className="bg-gray-900 border-gray-700 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg">Live Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Status</span>
                                        <Badge className="bg-green-600">Live</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Viewers</span>
                                        <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                                            {viewerCount}
                    </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Quality</span>
                                        <span>Auto (1080p)</span>
                                    </div>
                                    {channel.hlsSettings?.dvrDuration && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">DVR</span>
                                            <span>{channel.hlsSettings.dvrDuration} min</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Features */}
                            <Card className="bg-gray-900 border-gray-700 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg">Stream Features</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        {channel.hlsSettings?.vttEnabled && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>Subtitles Available</span>
                                            </div>
                                        )}
                                        {channel.hlsSettings?.catchupTvEnabled && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>Catch-up TV ({channel.hlsSettings.catchupDuration}h)</span>
                                            </div>
                                        )}
                                        {channel.hlsSettings?.geoLocking.enabled && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                <span>Geo-restricted</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <span>DVR Recording</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Share */}
                            <Card className="bg-gray-900 border-gray-700 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg">Share Stream</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button onClick={shareStream} className="w-full" variant="secondary">
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Copy Link
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
