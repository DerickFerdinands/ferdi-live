// Node.js script to seed Firebase with test data
import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
})

const db = getFirestore(app)
const auth = getAuth(app)

async function seedData() {
  try {
    console.log("🌱 Seeding Firebase with test data...")

    // Create test users
    const testUsers = [
      {
        email: "demo@streamflow.com",
        password: "demo123456",
        userData: {
          tenantId: "demo-tenant",
          isAdmin: false,
          subscription: {
            plan: "pro",
            status: "active",
            channels: 3,
          },
        },
      },
      {
        email: "admin@streamflow.com",
        password: "admin123456",
        userData: {
          tenantId: "admin-tenant",
          isAdmin: true,
          subscription: {
            plan: "enterprise",
            status: "active",
            channels: 10,
          },
        },
      },
    ]

    for (const testUser of testUsers) {
      try {
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
          email: testUser.email,
          password: testUser.password,
          emailVerified: true,
        })

        // Create user document in Firestore
        await db
          .collection("users")
          .doc(userRecord.uid)
          .set({
            uid: userRecord.uid,
            email: testUser.email,
            ...testUser.userData,
            createdAt: new Date(),
            lastActive: new Date(),
          })

        console.log(`✅ Created user: ${testUser.email}`)
      } catch (error) {
        if (error.code === "auth/email-already-exists") {
          console.log(`⚠️  User already exists: ${testUser.email}`)
        } else {
          console.error(`❌ Error creating user ${testUser.email}:`, error)
        }
      }
    }

    // Create test channels
    const testChannels = [
      {
        name: "Gaming Stream",
        description: "Live gaming content",
        tenantId: "demo-tenant",
        status: "active",
        instanceId: "i-1234567890abcdef0",
        hlsUrl: "https://stream.example.com/hls/gaming/playlist.m3u8",
        rtmpUrl: "rtmp://ingest.example.com/live/gaming",
        viewerCount: 156,
      },
      {
        name: "Music Live",
        description: "Live music performances",
        tenantId: "demo-tenant",
        status: "active",
        instanceId: "i-0987654321fedcba0",
        hlsUrl: "https://stream.example.com/hls/music/playlist.m3u8",
        rtmpUrl: "rtmp://ingest.example.com/live/music",
        viewerCount: 89,
      },
    ]

    for (const channel of testChannels) {
      const docRef = await db.collection("channels").add({
        ...channel,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Create analytics data for the channel
      await db
        .collection("analytics")
        .doc(docRef.id)
        .set({
          channelId: docRef.id,
          viewerCount: channel.viewerCount,
          peakViewers: Math.floor(channel.viewerCount * 1.5),
          totalViews: Math.floor(channel.viewerCount * 10),
          uptime: Math.floor(Math.random() * 100),
          geoDistribution: {
            "United States": Math.floor(channel.viewerCount * 0.4),
            "United Kingdom": Math.floor(channel.viewerCount * 0.2),
            Canada: Math.floor(channel.viewerCount * 0.15),
            Germany: Math.floor(channel.viewerCount * 0.1),
            Other: Math.floor(channel.viewerCount * 0.15),
          },
          createdAt: new Date(),
        })

      console.log(`✅ Created channel: ${channel.name}`)
    }

    console.log("🎉 Firebase seeding completed successfully!")
    console.log("\n📝 Test Accounts:")
    console.log("Demo User: demo@streamflow.com / demo123456")
    console.log("Admin User: admin@streamflow.com / admin123456")
  } catch (error) {
    console.error("❌ Error seeding data:", error)
  }
}

// Run the seeding function
seedData()
