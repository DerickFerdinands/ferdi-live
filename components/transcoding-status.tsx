"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Server, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface TranscodingStatusProps {
    channelId: string
    publicIp?: string
    transcodingUrl?: string
    services?: {
        transcoding?: boolean
        nginx?: boolean
        ffmpeg?: boolean
        transcodingStatus?: string
    }
}

export function TranscodingStatus({ channelId, publicIp, transcodingUrl, services }: TranscodingStatusProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [checking, setChecking] = useState(false)
    const [status, setStatus] = useState(services?.transcodingStatus || "unknown")

    const checkService = async () => {
        if (!user) return

        setChecking(true)
        try {
            const token = await user.getIdToken()

            const response = await fetch("/api/check-transcoding", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ channelId }),
            })

            const data = await response.json()

            if (response.ok) {
                setStatus(data.serviceStatus.status)
                toast({
                    title: "Service Status Updated",
                    description: `Transcoding service is ${data.serviceStatus.status}`,
                })
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to check service status",
                variant: "destructive",
            })
        } finally {
            setChecking(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case "unhealthy":
                return <XCircle className="h-4 w-4 text-red-600" />
            default:
                return <Server className="h-4 w-4 text-gray-400" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "healthy":
                return <Badge variant="default">Healthy</Badge>
            case "unhealthy":
                return <Badge variant="destructive">Unhealthy</Badge>
            default:
                return <Badge variant="secondary">Unknown</Badge>
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Transcoding Service
                </CardTitle>
                <CardDescription>Node.js transcoding service status and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="font-medium">Service Status</span>
                    </div>
                    {getStatusBadge(status)}
                </div>

                {publicIp && (
                    <Alert>
                        <AlertDescription>
                            <strong>Instance IP:</strong> {publicIp}
                            <br />
                            <strong>Health Check:</strong> http://{publicIp}:8080/health
                            {transcodingUrl && (
                                <>
                                    <br />
                                    <strong>Transcoding API:</strong> {transcodingUrl}
                                </>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            {services?.transcoding ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                        <div className="text-xs font-medium">Transcoding</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            {services?.nginx ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                        <div className="text-xs font-medium">NGINX</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            {services?.ffmpeg ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                        <div className="text-xs font-medium">FFmpeg</div>
                    </div>
                </div>

                <Button onClick={checkService} disabled={checking} className="w-full" variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
                    {checking ? "Checking..." : "Check Service Status"}
                </Button>

                <Alert>
                    <AlertDescription className="text-xs">
                        <strong>Instance Type:</strong> c5.xlarge (4 vCPUs, 8 GB RAM)
                        <br />
                        <strong>Services:</strong> Node.js Transcoding, NGINX RTMP, FFmpeg
                        <br />
                        <strong>Repository:</strong> rumexinc/node-transcoding (with fallback to NGINX)
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}
