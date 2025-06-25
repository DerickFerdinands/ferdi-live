import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { terminateInstance } from "@/lib/aws"

export async function DELETE(request: NextRequest) {
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

        // Get channel data to retrieve instance ID
        const channelDoc = await adminDb.collection("channels").doc(channelId).get()
        const channelData = channelDoc.data()

        if (!channelData) {
            return NextResponse.json({ error: "Channel not found" }, { status: 404 })
        }

        // Verify user owns this channel
        const userDoc = await adminDb.collection("users").doc(userId).get()
        const userData = userDoc.data()

        if (!userData || channelData.tenantId !== userData.tenantId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        console.log(`Deleting channel ${channelId} and terminating instance ${channelData.instanceId}`)

        // Terminate AWS instance if it exists and is not a mock
        if (channelData.instanceId && !channelData.isMock) {
            try {
                const terminationResult = await terminateInstance(channelData.instanceId)
                if (!terminationResult.success) {
                    console.error(`Failed to terminate instance ${channelData.instanceId}:`, terminationResult.error)
                } else {
                    console.log(`Successfully initiated termination of instance ${channelData.instanceId}`)
                }
            } catch (error) {
                console.error(`Error terminating instance ${channelData.instanceId}:`, error)
                // Continue with channel deletion even if instance termination fails
            }
        }

        // Delete channel document
        await adminDb.collection("channels").doc(channelId).delete()

        // Delete analytics data
        try {
            await adminDb.collection("analytics").doc(channelId).delete()
        } catch (error) {
            console.error("Error deleting analytics data:", error)
        }

        console.log(`Channel ${channelId} deleted successfully`)

        return NextResponse.json({
            success: true,
            message:
                channelData.instanceId && !channelData.isMock
                    ? "Channel deleted and AWS instance termination initiated"
                    : "Channel deleted successfully",
            instanceTerminated: !!(channelData.instanceId && !channelData.isMock),
        })
    } catch (error) {
        console.error("Error deleting channel:", error)
        return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 })
    }
}
