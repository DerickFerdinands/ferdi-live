import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { terminateInstance } from "@/lib/aws"

export async function POST(request: NextRequest) {
  try {
    const { channelId, instanceId } = await request.json()

    // Terminate EC2 instance
    if (instanceId) {
      await terminateInstance(instanceId)
    }

    // Update channel status
    await adminDb.collection("channels").doc(channelId).update({
      status: "inactive",
      terminatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error terminating stream:", error)
    return NextResponse.json({ error: "Failed to terminate stream" }, { status: 500 })
  }
}
