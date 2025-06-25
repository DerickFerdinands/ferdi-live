import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { createStreamingInstance } from "@/lib/aws"

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get("authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.split("Bearer ")[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const userId = decodedToken.uid

        const { channelId, hlsSettings } = await request.json()

        if (!channelId) {
            return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
        }

        // Check if user has permission to create channels
        const userDoc = await adminDb.collection("users").doc(userId).get()
        const userData = userDoc.data()

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Check channel limits based on subscription
        const existingChannels = await adminDb.collection("channels").where("tenantId", "==", userData.tenantId).get()

        const maxChannels = userData.subscription?.channels || 1
     /*   if (existingChannels.size >= maxChannels) {
            return NextResponse.json(
                { error: `Channel limit reached. Your plan allows ${maxChannels} channel(s).` },
                { status: 403 },
            )
        }*/

        console.log(`Creating Ferdi Live c5.xlarge Ubuntu instance with transcoding for channel: ${channelId}`)

        // Create EC2 instance with transcoding setup
        const instanceData = await createStreamingInstance(channelId)

        // Update channel document with instance details and HLS settings
        await adminDb
            .collection("channels")
            .doc(channelId)
            .update({
                instanceId: instanceData.instanceId,
                instanceType: instanceData.instanceType,
                storage: instanceData.storage,
                os: instanceData.os,
                publicIp: instanceData.publicIp,
                privateIp: instanceData.privateIp,
                hlsUrl: instanceData.hlsUrl,
                rtmpUrl: instanceData.rtmpUrl,
                transcodingUrl: instanceData.transcodingUrl,
                healthCheckUrl: instanceData.healthCheckUrl,
                status: "active",
                isMock: instanceData.isMock || false,
                hlsSettings: hlsSettings,
                services: {
                    transcoding: true,
                    nginx: true,
                    ffmpeg: true,
                    statusServer: true,
                },
                securityGroup: {
                    ports: [22, 80, 443, 1935, 8000],
                    source: "0.0.0.0/0",
                },
                updatedAt: new Date(),
            })

        // Initialize analytics data
        await adminDb
            .collection("analytics")
            .doc(channelId)
            .set({
                channelId,
                viewerCount: 0,
                peakViewers: 0,
                totalViews: 0,
                uptime: 0,
                geoDistribution: {},
                transcodingStats: {
                    activeJobs: 0,
                    completedJobs: 0,
                    failedJobs: 0,
                },
                instanceStats: {
                    type: instanceData.instanceType,
                    storage: instanceData.storage,
                    os: instanceData.os,
                },
                hlsSettings: hlsSettings,
                createdAt: new Date(),
            })

        console.log(
            `Ferdi Live channel ${channelId} provisioned successfully with ${instanceData.instanceType} instance ${instanceData.instanceId}`,
        )

        return NextResponse.json({
            success: true,
            instanceId: instanceData.instanceId,
            instanceType: instanceData.instanceType,
            storage: instanceData.storage,
            os: instanceData.os,
            publicIp: instanceData.publicIp,
            privateIp: instanceData.privateIp,
            hlsUrl: instanceData.hlsUrl,
            rtmpUrl: instanceData.rtmpUrl,
            transcodingUrl: instanceData.transcodingUrl,
            healthCheckUrl: instanceData.healthCheckUrl,
            isMock: instanceData.isMock || false,
            message: instanceData.isMock
                ? "Demo instance created (AWS not configured)"
                : `Ferdi Live ${instanceData.instanceType} Ubuntu instance with transcoding service provisioned successfully`,
        })
    } catch (error) {
        console.error("Error creating Ferdi Live channel:", error)
        return NextResponse.json({ error: "Failed to create channel" }, { status: 500 })
    }
}
