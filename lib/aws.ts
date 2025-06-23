// lib/aws.ts

import {
  EC2Client,
  RunInstancesCommand,
  TerminateInstancesCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2"

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

/**
 * Creates a c5.xlarge EC2 instance (Ubuntu) with your node-transcoding stack.
 */
export async function createStreamingInstance(channelId: string) {
  const launchTemplateId = process.env.AWS_LAUNCH_TEMPLATE_ID
  // Parse your comma-separated SG list; ensure it's nonempty
  const securityGroupIds = (process.env.SECURITY_GROUP_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

  if (!launchTemplateId && securityGroupIds.length === 0) {
    throw new Error(
        "Either AWS_LAUNCH_TEMPLATE_ID or SECURITY_GROUP_IDS must be set"
    )
  }

  let params: any = {
    MinCount: 1,
    MaxCount: 1,
    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [
          { Key: "Name", Value: `streaming-${channelId}` },
          { Key: "ChannelId", Value: channelId },
          { Key: "Purpose", Value: "StreamFlow-LiveStreaming" },
          { Key: "Service", Value: "NodeTranscoding" },
        ],
      },
    ],
  }

  if (launchTemplateId) {
    // Use your Launch Template; it should define AMI, SGs, InstanceType, etc.
    params.LaunchTemplate = {
      LaunchTemplateId: launchTemplateId,
      Version: "$Latest",
    }
    // Override only UserData
    params.UserData = Buffer.from(generateUserDataScript(channelId)).toString(
        "base64"
    )
  } else {
    // No Launch Template => specify everything explicitly
    params.ImageId = "ami-0d5d9d301c853a04a" // Ubuntu 22.04 LTS in us-east-1
    params.InstanceType = "c5.xlarge"
    params.SecurityGroupIds = securityGroupIds
    params.UserData = Buffer.from(generateUserDataScript(channelId)).toString(
        "base64"
    )
  }

  try {
    const { Instances } = await ec2Client.send(
        new RunInstancesCommand(params)
    )
    const instanceId = Instances?.[0]?.InstanceId
    if (!instanceId) throw new Error("Failed to launch instance")

    const { publicIp, privateIp } = await waitForInstanceRunning(instanceId)
    return {
      instanceId,
      publicIp,
      privateIp,
      hlsUrl: `http://${publicIp}/hls/${channelId}/playlist.m3u8`,
      rtmpUrl: `rtmp://${publicIp}/live/${channelId}`,
      transcodingUrl: `http://${publicIp}:3000/status`,
      status: "running",
      isMock: false,
    }
  } catch (err) {
    console.error("Error creating EC2 instance:", err)
    // Fallback mock
    const mockIp = Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * 256))
        .join(".")
    return {
      instanceId: `i-${Math.random().toString(36).slice(2, 11)}`,
      publicIp: mockIp,
      privateIp: `10.0.1.${Math.floor(Math.random() * 255)}`,
      hlsUrl: `http://${mockIp}/hls/${channelId}/playlist.m3u8`,
      rtmpUrl: `rtmp://${mockIp}/live/${channelId}`,
      transcodingUrl: `http://${mockIp}:3000/status`,
      status: "running",
      isMock: true,
    }
  }
}

function generateUserDataScript(channelId: string): string {
  return `#!/bin/bash
set -e
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=== StreamFlow Ubuntu setup for channel ${channelId} ==="

# 1. System update & core packages
apt-get update -y
apt-get install -y docker.io git curl build-essential ffmpeg

# 2. Docker setup
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu

# 3. Node.js LTS install
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# 4. Clone & install transcoding project
mkdir -p /home/ubuntu/projects
cd /home/ubuntu/projects

# ←– GitHub creds used right here:
git clone https://derickFerdinands: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@github.com/rumexinc/node-transcoding.git

cd node-transcoding
npm install
npm install chokidar

# 5. Write systemd service
cat >/etc/systemd/system/node-transcoding.service <<'EOF'
[Unit]
Description=Node Transcoding Service
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/projects/node-transcoding
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin:/home/ubuntu/.nvm/versions/node/v18.0.0/bin
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=node-transcoding

[Install]
WantedBy=multi-user.target
EOF

# 6. Permissions, enable & start service
chown -R ubuntu:ubuntu /home/ubuntu/projects
systemctl daemon-reload
systemctl enable node-transcoding.service
systemctl start node-transcoding.service

echo "=== StreamFlow setup complete ==="
`
}

async function waitForInstanceRunning(
    instanceId: string,
    maxAttempts = 30
): Promise<{ publicIp: string; privateIp: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    )
    const inst = Reservations?.[0]?.Instances?.[0]
    if (inst?.State?.Name === "running" && inst.PublicIpAddress) {
      return { publicIp: inst.PublicIpAddress, privateIp: inst.PrivateIpAddress || "" }
    }
    await new Promise((r) => setTimeout(r, 10000))
  }
  throw new Error("Instance did not become ready in time")
}

export async function terminateInstance(instanceId: string) {
  try {
    await ec2Client.send(
        new TerminateInstancesCommand({ InstanceIds: [instanceId] })
    )
    return { success: true }
  } catch (error) {
    console.error("Error terminating instance:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getInstanceStatus(instanceId: string) {
  try {
    const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    )
    const inst = Reservations?.[0]?.Instances?.[0]
    return {
      instanceId,
      state: inst?.State?.Name || "unknown",
      publicIp: inst?.PublicIpAddress,
      privateIp: inst?.PrivateIpAddress,
      launchTime: inst?.LaunchTime,
    }
  } catch (error) {
    console.error("Error getting instance status:", error)
    return null
  }
}
