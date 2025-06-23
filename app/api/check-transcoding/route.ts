import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { checkTranscodingService } from "@/lib/aws"

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get("authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.split("Bearer ")[1]
        await adminAuth.verifyIdToken(token)

        const { channelId } = await request.json()

        if (!channelId) {
            return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
        }

        // Get channel data
        const channelDoc = await adminDb.collection("channels").doc(channelId).get()
        const channelData = channelDoc.data()

        if (!channelData || !channelData.publicIp) {
            return NextResponse.json({ error: "Channel not found or no IP address" }, { status: 404 })
        }

        // Check transcoding service status
        const serviceStatus = await checkTranscodingService(channelData.publicIp)

        // Update channel with service status
        await adminDb.collection("channels").doc(channelId).update({
            "services.transcodingStatus": serviceStatus.status,
            "services.lastChecked": new Date(),
        })

        return NextResponse.json({
            success: true,
            channelId,
            publicIp: channelData.publicIp,
            serviceStatus,
        })
    } catch (error) {
        console.error("Error checking transcoding service:", error)
        return NextResponse.json({ error: "Failed to check transcoding service" }, { status: 500 })
    }
}
