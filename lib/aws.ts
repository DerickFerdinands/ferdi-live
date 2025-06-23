import { EC2Client } from "@aws-sdk/client-ec2"

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function createStreamingInstance(channelId: string) {
  // Mock implementation for demo - replace with actual Launch Template
  const mockInstanceId = `i-${Math.random().toString(36).substr(2, 17)}`
  const mockHlsUrl = `https://stream.example.com/hls/${channelId}/playlist.m3u8`
  const mockRtmpUrl = `rtmp://ingest.example.com/live/${channelId}`

  // In production, use actual EC2 Launch Template
  /*
  const command = new RunInstancesCommand({
    LaunchTemplate: {
      LaunchTemplateId: process.env.AWS_LAUNCH_TEMPLATE_ID,
    },
    MinCount: 1,
    MaxCount: 1,
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [
          { Key: 'Name', Value: `streaming-${channelId}` },
          { Key: 'ChannelId', Value: channelId },
        ],
      },
    ],
  })

  const response = await ec2Client.send(command)
  const instanceId = response.Instances?.[0]?.InstanceId
  */

  return {
    instanceId: mockInstanceId,
    hlsUrl: mockHlsUrl,
    rtmpUrl: mockRtmpUrl,
    status: "running",
  }
}

export async function terminateInstance(instanceId: string) {
  // Mock implementation
  return { success: true }

  /*
  const command = new TerminateInstancesCommand({
    InstanceIds: [instanceId],
  })
  
  await ec2Client.send(command)
  */
}
