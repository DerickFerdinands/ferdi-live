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

    const { channelId } = await request.json()

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

   /* const maxChannels = userData.subscription?.channels || 1
    if (existingChannels.size >= maxChannels) {
      return NextResponse.json(
          { error: `Channel limit reached. Your plan allows ${maxChannels} channel(s).` },
          { status: 403 },
      )
    }*/

    console.log(`Creating c5.xlarge EC2 instance with transcoding for channel: ${channelId}`)

    // Create EC2 instance with transcoding setup
    const instanceData = await createStreamingInstance(channelId)

    // Update channel document with instance details
    await adminDb
        .collection("channels")
        .doc(channelId)
        .update({
          instanceId: instanceData.instanceId,
          instanceType: "c5.xlarge",
          publicIp: instanceData.publicIp,
          privateIp: instanceData.privateIp,
          hlsUrl: instanceData.hlsUrl,
          rtmpUrl: instanceData.rtmpUrl,
          transcodingUrl: instanceData.transcodingUrl,
          status: "active",
          isMock: instanceData.isMock || false,
          services: {
            transcoding: true,
            nginx: true,
            ffmpeg: true,
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
          createdAt: new Date(),
        })

    console.log(`Channel ${channelId} provisioned successfully with c5.xlarge instance ${instanceData.instanceId}`)

    return NextResponse.json({
      success: true,
      instanceId: instanceData.instanceId,
      instanceType: "c5.xlarge",
      publicIp: instanceData.publicIp,
      privateIp: instanceData.privateIp,
      hlsUrl: instanceData.hlsUrl,
      rtmpUrl: instanceData.rtmpUrl,
      transcodingUrl: instanceData.transcodingUrl,
      isMock: instanceData.isMock || false,
      message: instanceData.isMock
          ? "Demo instance created (AWS not configured)"
          : "c5.xlarge instance with transcoding service provisioned successfully",
    })
  } catch (error) {
    console.error("Error creating channel:", error)
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 })
  }
}
