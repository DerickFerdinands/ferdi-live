"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Clock, Tv, Radio } from "lucide-react"

interface QualityProfile {
    name: string
    resolution: string
    bitrate: number
    fps: number
    enabled: boolean
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

interface EnhancedVideoPlayerProps {
    hlsUrl: string
    title?: string
    autoplay?: boolean
    qualityProfiles?: QualityProfile[]
    epgData?: EPGProgram[]
    showControls?: boolean
}

export function EnhancedVideoPlayer({
                                        hlsUrl,
                                        title = "Live Stream",
                                        autoplay = false,
                                        qualityProfiles = [],
                                        epgData = [],
                                        showControls = true,
                                    }: EnhancedVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<any>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [selectedQuality, setSelectedQuality] = useState<string>("auto")
    const [showSettings, setShowSettings] = useState(false)
    const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null)

    // Mock EPG data if none provided
    const mockEPGData: EPGProgram[] =
        epgData.length > 0
            ? epgData
            : [
                {
                    id: "1",
                    title: "Morning News",
                    description: "Latest news and weather updates",
                    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    endTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
                    category: "News",
                    isLive: true,
                },
                {
                    id: "2",
                    title: "Tech Talk Show",
                    description: "Discussion about latest technology trends",
                    startTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
                    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
                    category: "Technology",
                },
                {
                    id: "3",
                    title: "Sports Highlights",
                    description: "Best moments from today's games",
                    startTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
                    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
                    category: "Sports",
                },
            ]

    // Mock quality profiles if none provided
    const mockQualityProfiles: QualityProfile[] =
        qualityProfiles.length > 0
            ? qualityProfiles
            : [
                { name: "1080p", resolution: "1920x1080", bitrate: 4000, fps: 30, enabled: true },
                { name: "720p", resolution: "1280x720", bitrate: 2000, fps: 30, enabled: true },
                { name: "480p", resolution: "854x480", bitrate: 1000, fps: 30, enabled: true },
            ]

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        // Find current program
        const now = new Date()
        const current = mockEPGData.find((program) => now >= program.startTime && now <= program.endTime)
        setCurrentProgram(current || null)

        // Check if HLS.js is supported
        if (typeof window !== "undefined") {
            import("hls.js")
                .then(({ default: Hls }) => {
                    if (Hls.isSupported()) {
                        const hls = new Hls({
                            enableWorker: false,
                        })

                        hlsRef.current = hls
                        hls.loadSource(hlsUrl)
                        hls.attachMedia(video)

                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            if (autoplay) {
                                video
                                    .play()
                                    .then(() => setIsPlaying(true))
                                    .catch(console.error)
                            }
                        })

                        hls.on(Hls.Events.ERROR, (event, data) => {
                            console.error("HLS Error:", data)
                        })
                    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                        // Native HLS support (Safari)
                        video.src = hlsUrl
                        if (autoplay) {
                            video
                                .play()
                                .then(() => setIsPlaying(true))
                                .catch(console.error)
                        }
                    }
                })
                .catch((error) => {
                    console.error("Failed to load HLS.js:", error)
                })
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy()
            }
        }
    }, [hlsUrl, autoplay])

    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return

        if (isPlaying) {
            video.pause()
            setIsPlaying(false)
        } else {
            video
                .play()
                .then(() => setIsPlaying(true))
                .catch(console.error)
        }
    }

    const toggleMute = () => {
        const video = videoRef.current
        if (!video) return

        video.muted = !video.muted
        setIsMuted(video.muted)
    }

    const toggleFullscreen = () => {
        const video = videoRef.current
        if (!video) return

        if (!document.fullscreenElement) {
            video.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getProgressPercentage = (program: EPGProgram) => {
        const now = new Date()
        const total = program.endTime.getTime() - program.startTime.getTime()
        const elapsed = now.getTime() - program.startTime.getTime()
        return Math.max(0, Math.min(100, (elapsed / total) * 100))
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-0">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                        <video
                            ref={videoRef}
                            className="w-full h-full"
                            muted={isMuted}
                            playsInline
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />

                        {/* Video Controls Overlay */}
                        {showControls && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={togglePlay}
                                            className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                                        >
                                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={toggleMute}
                                            className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                                        >
                                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                        </Button>

                                        {currentProgram && (
                                            <div className="text-white text-sm">
                                                <div className="font-medium">{currentProgram.title}</div>
                                                <div className="text-xs opacity-75">
                                                    {formatTime(currentProgram.startTime)} - {formatTime(currentProgram.endTime)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setShowSettings(!showSettings)}
                                            className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={toggleFullscreen}
                                            className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                                        >
                                            <Maximize className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Live indicator */}
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-red-600">
                                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                        LIVE
                                    </Badge>
                                </div>

                                {/* Quality selector */}
                                {showSettings && (
                                    <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-4 min-w-48">
                                        <div className="text-white text-sm font-medium mb-2">Quality</div>
                                        <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="auto">Auto</SelectItem>
                                                {mockQualityProfiles
                                                    .filter((p) => p.enabled)
                                                    .map((profile) => (
                                                        <SelectItem key={profile.name} value={profile.name}>
                                                            {profile.name} ({profile.resolution})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stream Info and EPG */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Quality Profiles */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Available Qualities
                        </CardTitle>
                        <CardDescription>Video quality options</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {mockQualityProfiles
                                .filter((p) => p.enabled)
                                .map((profile, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                                        <div>
                                            <div className="font-medium">{profile.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {profile.resolution} • {profile.bitrate}kbps
                                            </div>
                                        </div>
                                        <Badge variant={selectedQuality === profile.name ? "default" : "outline"}>{profile.fps} FPS</Badge>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Electronic Program Guide */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tv className="h-5 w-5" />
                            Program Guide
                        </CardTitle>
                        <CardDescription>What's on now and coming up</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="now" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="now">Now Playing</TabsTrigger>
                                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                            </TabsList>

                            <TabsContent value="now" className="space-y-4">
                                {currentProgram ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-red-600">
                                                <Radio className="h-3 w-3 mr-1" />
                                                LIVE
                                            </Badge>
                                            <Badge variant="outline">{currentProgram.category}</Badge>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold">{currentProgram.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{currentProgram.description}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{formatTime(currentProgram.startTime)}</span>
                                                <span>{formatTime(currentProgram.endTime)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                                                    style={{ width: `${getProgressPercentage(currentProgram)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">No program information available</div>
                                )}
                            </TabsContent>

                            <TabsContent value="schedule" className="space-y-3">
                                {mockEPGData.map((program) => (
                                    <div key={program.id} className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{program.title}</span>
                                                {program.isLive && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        LIVE
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-xs">
                                                    {program.category}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatTime(program.startTime)} - {formatTime(program.endTime)}
                                            </div>
                                        </div>
                                        <Clock className="h-4 w-4 text-gray-400" />
                                    </div>
                                ))}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <Alert>
                <AlertDescription className="text-xs">
                    <strong>Stream URL:</strong> {hlsUrl}
                </AlertDescription>
            </Alert>
        </div>
    )
}
