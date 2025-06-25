"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Server, CheckCircle, XCircle, RefreshCw, Monitor, HardDrive, Cpu } from "lucide-react"

interface TranscodingStatusProps {
    channelId: string
    publicIp?: string
    transcodingUrl?: string
    healthCheckUrl?: string
    instanceType?: string
    storage?: string
    os?: string
    services?: {
        transcoding?: boolean
        nginx?: boolean
        ffmpeg?: boolean
        statusServer?: boolean
        transcodingStatus?: string
    }
}

export function TranscodingStatus({
                                      channelId,
                                      publicIp,
                                      transcodingUrl,
                                      healthCheckUrl,
                                      instanceType,
                                      storage,
                                      os,
                                      services,
                                  }: TranscodingStatusProps) {
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
                    Ubuntu Transcoding Server
                </CardTitle>
                <CardDescription>c5.xlarge instance with Node.js transcoding service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Instance Specifications */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Cpu className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-xs font-medium">{instanceType || "c5.xlarge"}</div>
                        <div className="text-xs text-gray-500">4 vCPUs, 8GB RAM</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <HardDrive className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-xs font-medium">{storage || "25GB"}</div>
                        <div className="text-xs text-gray-500">SSD Storage</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Monitor className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-xs font-medium">{os || "Ubuntu 22.04"}</div>
                        <div className="text-xs text-gray-500">LTS</div>
                    </div>
                </div>

                {/* Service Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="font-medium">Service Status</span>
                    </div>
                    {getStatusBadge(status)}
                </div>

                {/* Connection Information */}
                {publicIp && (
                    <Alert>
                        <AlertDescription className="text-xs">
                            <strong>Public IP:</strong> {publicIp}
                            <br />
                            <strong>Health Check:</strong> http://{publicIp}:8080/health
                            <br />
                            <strong>Transcoding API:</strong> http://{publicIp}:8000/api/status
                            <br />
                            <strong>Security Group:</strong> Ports 22, 80, 443, 1935, 8000 (0.0.0.0/0)
                        </AlertDescription>
                    </Alert>
                )}

                {/* Services Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 border rounded">
                        <div className="flex items-center justify-center mb-1">
                            {services?.transcoding ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                        <div className="text-xs font-medium">Node Transcoding</div>
                        <div className="text-xs text-gray-500">Port 8000</div>
                    </div>
                    <div className="text-center p-2 border rounded">
                        <div className="flex items-center justify-center mb-1">
                            {services?.nginx ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                        <div className="text-xs font-medium">NGINX RTMP</div>
                        <div className="text-xs text-gray-500">Port 1935</div>
                    </div>
                    <div className="text-center p-2 border rounded">
                        <div className="flex items-center justify-center mb-1">
                            {services?.ffmpeg ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                        <div className="text-xs font-medium">FFmpeg</div>
                        <div className="text-xs text-gray-500">Transcoding</div>
                    </div>
                    <div className="text-center p-2 border rounded">
                        <div className="flex items-center justify-center mb-1">
                            {services?.statusServer ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                        <div className="text-xs font-medium">Status Server</div>
                        <div className="text-xs text-gray-500">Port 8080</div>
                    </div>
                </div>

                <Button onClick={checkService} disabled={checking} className="w-full" variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
                    {checking ? "Checking..." : "Check Service Status"}
                </Button>

                {/* Setup Information */}
                <Alert>
                    <AlertDescription className="text-xs">
                        <strong>Setup Commands:</strong> Automated via UserData script
                        <br />
                        <strong>Repository:</strong> rumexinc/node-transcoding (with GitHub credentials)
                        <br />
                        <strong>Systemd Service:</strong> node-transcoding.service
                        <br />
                        <strong>User:</strong> ubuntu:ubuntu
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}
