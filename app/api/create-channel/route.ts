import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { createStreamingInstance } from "@/lib/aws"

export async function POST(request: NextRequest) {
  try {
    const { channelId } = await request.json()

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    // Create EC2 instance
    const instanceData = await createStreamingInstance(channelId)

    // Update channel document with instance details
    await adminDb.collection("channels").doc(channelId).update({
      instanceId: instanceData.instanceId,
      hlsUrl: instanceData.hlsUrl,
      rtmpUrl: instanceData.rtmpUrl,
      status: "active",
      updatedAt: new Date(),
    })

    // Initialize analytics data
    await adminDb.collection("analytics").doc(channelId).set({
      channelId,
      viewerCount: 0,
      peakViewers: 0,
      totalViews: 0,
      uptime: 0,
      geoDistribution: {},
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      instanceId: instanceData.instanceId,
      hlsUrl: instanceData.hlsUrl,
      rtmpUrl: instanceData.rtmpUrl,
    })
  } catch (error) {
    console.error("Error creating channel:", error)
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 })
  }
}
