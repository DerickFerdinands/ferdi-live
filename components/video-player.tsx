"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play } from "lucide-react"

interface VideoPlayerProps {
    hlsUrl: string
    title?: string
    autoplay?: boolean
}

export function VideoPlayer({ hlsUrl, title = "Live Stream", autoplay = false }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<any>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

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
                                video.play().catch(console.error)
                            }
                        })

                        hls.on(Hls.Events.ERROR, (event, data) => {
                            console.error("HLS Error:", data)
                        })
                    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                        // Native HLS support (Safari)
                        video.src = hlsUrl
                        if (autoplay) {
                            video.play().catch(console.error)
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>Live stream preview</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} className="w-full h-full" controls muted playsInline />
                </div>

                <Alert className="mt-4">
                    <AlertDescription className="text-xs">
                        <strong>Stream URL:</strong> {hlsUrl}
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}
