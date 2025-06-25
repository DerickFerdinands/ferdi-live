// Node.js script to generate diagram images from Mermaid syntax
import puppeteer from "puppeteer"
import fs from "fs"
import path from "path"

const diagrams = [
    {
        name: "system-architecture",
        title: "System Architecture Overview",
        mermaid: `
graph TB
    subgraph "Client Layer"
        A["Web Browser"]
        B["Mobile App"]
        C["Admin Dashboard"]
    end
    
    subgraph "Frontend Layer"
        D["Next.js App Router"]
        E["React Components"]
        F["Tailwind CSS"]
        G["shadcn/ui"]
    end
    
    subgraph "Authentication"
        H["Firebase Auth"]
        I["JWT Tokens"]
    end
    
    subgraph "API Layer"
        J["Next.js API Routes"]
        K["Server Actions"]
        L["Middleware"]
    end
    
    subgraph "Business Logic"
        M["Channel Management"]
        N["Stream Processing"]
        O["Analytics Engine"]
        P["Billing System"]
    end
    
    subgraph "External Services"
        Q["Stripe Payment"]
        R["AWS EC2"]
        S["Firebase Services"]
    end
    
    subgraph "Data Layer"
        T["Firestore DB"]
        U["Realtime DB"]
        V["Firebase Storage"]
    end
    
    subgraph "Infrastructure"
        W["EC2 Instances"]
        X["NGINX RTMP"]
        Y["FFmpeg"]
        Z["HLS Streaming"]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> G
    E --> F
    D --> H
    H --> I
    D --> J
    J --> K
    J --> L
    K --> M
    K --> N
    K --> O
    K --> P
    M --> Q
    M --> R
    M --> S
    N --> W
    O --> T
    P --> Q
    S --> T
    S --> U
    S --> V
    W --> X
    W --> Y
    X --> Z
    `,
    },
    {
        name: "component-architecture",
        title: "Component Architecture",
        mermaid: `
graph TB
    subgraph "Pages"
        A["Dashboard Page"]
        B["Stream Page"]
        C["Analytics Page"]
        D["Billing Page"]
        E["Admin Page"]
        F["Auth Pages"]
    end
    
    subgraph "Layout Components"
        G["App Layout"]
        H["Dashboard Layout"]
        I["Admin Layout"]
        J["Auth Guard"]
    end
    
    subgraph "Feature Components"
        K["Video Player"]
        L["Channel Creation Form"]
        M["Program Schedule"]
        N["Transcoding Status"]
        O["Package Selection"]
    end
    
    subgraph "UI Components"
        P["Cards"]
        Q["Tables"]
        R["Forms"]
        S["Charts"]
        T["Dialogs"]
    end
    
    subgraph "Providers"
        U["Auth Provider"]
        V["Theme Provider"]
    end
    
    subgraph "Hooks"
        W["useAuth"]
        X["useToast"]
        Y["useMobile"]
    end
    
    subgraph "Utils"
        Z["Firebase Config"]
        AA["Stripe Config"]
        AB["AWS Config"]
    end
    
    A --> G
    B --> G
    C --> H
    D --> H
    E --> I
    F --> G
    G --> J
    H --> J
    I --> J
    A --> K
    A --> L
    A --> M
    A --> N
    F --> O
    K --> P
    L --> R
    M --> Q
    C --> S
    L --> T
    G --> U
    G --> V
    U --> W
    P --> X
    G --> Y
    U --> Z
    D --> AA
    A --> AB
    `,
    },
    {
        name: "data-flow",
        title: "Data Flow Diagram",
        mermaid: `
graph LR
    subgraph "User Actions"
        A["User Login"]
        B["Create Channel"]
        C["Start Stream"]
        D["View Analytics"]
        E["Manage Billing"]
    end
    
    subgraph "Processing"
        F["Authentication"]
        G["Channel Provisioning"]
        H["Stream Processing"]
        I["Data Collection"]
        J["Payment Processing"]
    end
    
    subgraph "Data Storage"
        K["User Data"]
        L["Channel Data"]
        M["Stream Data"]
        N["Analytics Data"]
        O["Billing Data"]
    end
    
    subgraph "External Systems"
        P["AWS EC2"]
        Q["Stripe API"]
        R["Firebase"]
    end
    
    A --> F
    F --> K
    F --> R
    
    B --> G
    G --> L
    G --> P
    L --> R
    
    C --> H
    H --> M
    H --> P
    M --> R
    
    D --> I
    I --> N
    N --> R
    
    E --> J
    J --> O
    J --> Q
    O --> R
    `,
    },
    {
        name: "use-case",
        title: "Use Case Diagram",
        mermaid: `
graph TB
    subgraph "Actors"
        A["Viewer"]
        B["Content Creator"]
        C["Admin"]
        D["System"]
    end
    
    subgraph "Viewer Use Cases"
        E["Watch Live Stream"]
        F["View Program Guide"]
        G["Change Quality"]
        H["Share Stream"]
        I["Access Catch-up TV"]
    end
    
    subgraph "Creator Use Cases"
        J["Sign Up/Login"]
        K["Create Channel"]
        L["Configure Stream Settings"]
        M["Start/Stop Stream"]
        N["View Analytics"]
        O["Manage Billing"]
        P["Schedule Programs"]
    end
    
    subgraph "Admin Use Cases"
        Q["Monitor System"]
        R["Manage Users"]
        S["Terminate Streams"]
        T["View System Analytics"]
        U["Manage Infrastructure"]
    end
    
    subgraph "System Use Cases"
        V["Process Payments"]
        W["Provision Infrastructure"]
        X["Collect Analytics"]
        Y["Send Notifications"]
        Z["Auto-scale Resources"]
    end
    
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    
    B --> J
    B --> K
    B --> L
    B --> M
    B --> N
    B --> O
    B --> P
    
    C --> Q
    C --> R
    C --> S
    C --> T
    C --> U
    
    D --> V
    D --> W
    D --> X
    D --> Y
    D --> Z
    `,
    },
    {
        name: "entity-relationship",
        title: "Entity Relationship Diagram",
        mermaid: `
erDiagram
    USER {
        string uid PK
        string email
        string tenantId
        boolean isAdmin
        timestamp createdAt
        timestamp lastActive
    }
    
    SUBSCRIPTION {
        string userId FK
        string plan
        string status
        number channels
        string stripeCustomerId
        string stripeSubscriptionId
        timestamp currentPeriodEnd
    }
    
    CHANNEL {
        string id PK
        string name
        string description
        string tenantId FK
        string status
        string instanceId
        string publicIp
        string hlsUrl
        string rtmpUrl
        timestamp createdAt
    }
    
    HLS_SETTINGS {
        string channelId FK
        json qualityProfiles
        boolean vttEnabled
        number segmentLength
        number dvrDuration
        json geoLocking
        json ipRestrictions
        boolean catchupTvEnabled
    }
    
    PROGRAM_SCHEDULE {
        string id PK
        string liveChannelId FK
        string programmeId
        string title
        string description
        timestamp startTime
        timestamp endTime
        timestamp createdAt
    }
    
    ANALYTICS {
        string channelId FK
        number viewerCount
        number peakViewers
        number totalViews
        number uptime
        json geoDistribution
        json qualityDistribution
        timestamp createdAt
    }
    
    INVOICE {
        string id PK
        string userId FK
        number amount
        string status
        string plan
        string period
        timestamp date
    }
    
    USER ||--|| SUBSCRIPTION : has
    USER ||--o{ CHANNEL : owns
    CHANNEL ||--|| HLS_SETTINGS : configured_with
    CHANNEL ||--o{ PROGRAM_SCHEDULE : contains
    CHANNEL ||--|| ANALYTICS : generates
    USER ||--o{ INVOICE : receives
    `,
    },
    {
        name: "sequence-channel-creation",
        title: "Channel Creation Sequence",
        mermaid: `
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant FB as Firebase
    participant AWS as AWS EC2
    participant S as Stripe
    
    U->>F: Click "Create Channel"
    F->>F: Open Channel Form
    U->>F: Fill Channel Details
    U->>F: Configure HLS Settings
    F->>A: POST /api/create-channel
    A->>FB: Verify User Auth
    FB-->>A: User Data
    A->>FB: Check Channel Limits
    FB-->>A: Subscription Info
    A->>AWS: Create EC2 Instance
    AWS-->>A: Instance Details
    A->>FB: Save Channel Data
    FB-->>A: Success
    A-->>F: Channel Created
    F-->>U: Show Success Message
    
    Note over AWS: Instance boots with<br/>transcoding services
    AWS->>FB: Update Instance Status
    `,
    },
    {
        name: "state-channel-lifecycle",
        title: "Channel State Diagram",
        mermaid: `
stateDiagram-v2
    [*] --> Creating
    Creating --> Provisioning : Instance Created
    Provisioning --> Active : Services Ready
    Active --> Streaming : RTMP Connected
    Streaming --> Active : Stream Stopped
    Active --> Maintenance : Admin Action
    Maintenance --> Active : Maintenance Complete
    Active --> Terminating : Delete Channel
    Streaming --> Terminating : Delete Channel
    Provisioning --> Failed : Provision Error
    Failed --> Terminating : Cleanup
    Terminating --> [*]
    
    Active : Entry / Start Health Checks
    Active : Do / Monitor Performance
    Streaming : Entry / Start Analytics
    Streaming : Do / Process Stream
    Streaming : Exit / Save Analytics
    `,
    },
    {
        name: "network-architecture",
        title: "Network Architecture",
        mermaid: `
graph TB
    subgraph "Internet"
        A["Content Creators"]
        B["Viewers"]
        C["Admin Users"]
    end
    
    subgraph "CDN/Load Balancer"
        D["CloudFront CDN"]
        E["Load Balancer"]
    end
    
    subgraph "Application Layer"
        F["Next.js App"]
        G["API Gateway"]
    end
    
    subgraph "Authentication"
        H["Firebase Auth"]
    end
    
    subgraph "Database Layer"
        I["Firestore"]
        J["Realtime DB"]
    end
    
    subgraph "Payment Processing"
        K["Stripe"]
    end
    
    subgraph "Streaming Infrastructure"
        L["EC2 Instance 1"]
        M["EC2 Instance 2"]
        N["EC2 Instance N"]
    end
    
    subgraph "Instance Services"
        O["NGINX RTMP"]
        P["FFmpeg"]
        Q["Node.js API"]
        R["HLS Output"]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    G --> I
    G --> J
    G --> K
    G --> L
    G --> M
    G --> N
    L --> O
    L --> P
    L --> Q
    L --> R
    M --> O
    M --> P
    M --> Q
    M --> R
    `,
    },
    {
        name: "deployment-architecture",
        title: "Deployment Architecture",
        mermaid: `
graph TB
    subgraph "Vercel Platform"
        A["Next.js Application"]
        B["API Routes"]
        C["Static Assets"]
    end
    
    subgraph "Firebase Services"
        D["Authentication"]
        E["Firestore Database"]
        F["Realtime Database"]
        G["Cloud Storage"]
    end
    
    subgraph "AWS Infrastructure"
        H["EC2 Instances"]
        I["Security Groups"]
        J["Auto Scaling"]
        K["CloudWatch"]
    end
    
    subgraph "Third Party Services"
        L["Stripe Payments"]
        M["GitHub Repository"]
    end
    
    subgraph "Monitoring & Analytics"
        N["Firebase Analytics"]
        O["Custom Analytics"]
        P["Error Tracking"]
    end
    
    A --> B
    A --> C
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H
    B --> L
    H --> I
    H --> J
    H --> K
    A --> N
    B --> O
    A --> P
    M --> A
    `,
    },
    {
        name: "user-journey",
        title: "User Journey Flow",
        mermaid: `
graph TD
    A["Landing Page"] --> B["Sign Up"]
    B --> C["Select Package"]
    C --> D["Payment"]
    D --> E["Dashboard"]
    E --> F["Create Channel"]
    F --> G["Configure Settings"]
    G --> H["Channel Created"]
    H --> I["Start Streaming"]
    I --> J["Monitor Analytics"]
    J --> K["Manage Programs"]
    K --> L["View Billing"]
    L --> M["Upgrade Plan"]
    
    E --> N["View Analytics"]
    E --> O["Manage Billing"]
    H --> P["Share Stream"]
    I --> Q["Stop Stream"]
    Q --> H
    
    subgraph "Viewer Journey"
        R["Discover Stream"] --> S["Watch Stream"]
        S --> T["Change Quality"]
        S --> U["View EPG"]
        S --> V["Share Stream"]
    end
    `,
    },
]

async function generateDiagramImages() {
    console.log("🎨 Starting diagram image generation...")

    // Create output directory
    const outputDir = "./generated-diagrams"
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    // Launch browser
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    try {
        for (const diagram of diagrams) {
            console.log(`📊 Generating ${diagram.title}...`)

            const page = await browser.newPage()
            await page.setViewport({ width: 1200, height: 800 })

            // Create HTML with Mermaid
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 20px;
              background: white;
            }
            .mermaid {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 600px;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 30px;
              font-size: 24px;
            }
          </style>
        </head>
        <body>
          <h1>${diagram.title}</h1>
          <div class="mermaid">
            ${diagram.mermaid}
          </div>
          <script>
            mermaid.initialize({
              startOnLoad: true,
              theme: 'default',
              themeVariables: {
                primaryColor: '#3b82f6',
                primaryTextColor: '#1f2937',
                primaryBorderColor: '#e5e7eb',
                lineColor: '#6b7280',
                secondaryColor: '#f3f4f6',
                tertiaryColor: '#ffffff'
              }
            });
          </script>
        </body>
        </html>
      `

            await page.setContent(html)

            // Wait for Mermaid to render
            // await page.waitForTimeout(3000)

            // Take screenshot
            const outputPath = path.join(outputDir, `${diagram.name}.png`)
            await page.screenshot({
                path: outputPath,
                fullPage: true,
                type: "png",
            })

            console.log(`✅ Generated: ${outputPath}`)
            await page.close()
        }

        // Generate index HTML file
        const indexHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ferdi Live - System Diagrams</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 40px;
            background: #f8fafc;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #1e293b;
            text-align: center;
            margin-bottom: 40px;
            font-size: 32px;
          }
          .diagram-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 30px;
          }
          .diagram-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .diagram-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }
          .diagram-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-bottom: 1px solid #e2e8f0;
          }
          .diagram-info {
            padding: 20px;
          }
          .diagram-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
          }
          .diagram-description {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
          }
          .download-btn {
            display: inline-block;
            margin-top: 12px;
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            transition: background 0.2s;
          }
          .download-btn:hover {
            background: #2563eb;
          }
          .header-info {
            text-align: center;
            margin-bottom: 40px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎯 Ferdi Live - System Architecture Diagrams</h1>
          <div class="header-info">
            <p>Comprehensive visual documentation of the Ferdi Live streaming platform architecture, components, and data flows.</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="diagram-grid">
            ${diagrams
            .map(
                (diagram) => `
              <div class="diagram-card">
                <img src="${diagram.name}.png" alt="${diagram.title}" />
                <div class="diagram-info">
                  <div class="diagram-title">${diagram.title}</div>
                  <div class="diagram-description">
                    ${getDiagramDescription(diagram.name)}
                  </div>
                  <a href="${diagram.name}.png" download class="download-btn">
                    📥 Download PNG
                  </a>
                </div>
              </div>
            `,
            )
            .join("")}
          </div>
        </div>
      </body>
      </html>
    `

        fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml)
        console.log(`📄 Generated index.html`)

        console.log(`\n🎉 All diagrams generated successfully!`)
        console.log(`📁 Output directory: ${path.resolve(outputDir)}`)
        console.log(`🌐 Open index.html to view all diagrams`)
    } catch (error) {
        console.error("❌ Error generating diagrams:", error)
    } finally {
        await browser.close()
    }
}

function getDiagramDescription(name) {
    const descriptions = {
        "system-architecture":
            "High-level overview of the entire system architecture including client, frontend, API, and infrastructure layers.",
        "component-architecture": "Detailed breakdown of React components, pages, providers, and their relationships.",
        "data-flow": "Shows how data flows through the system from user actions to storage and external services.",
        "use-case":
            "Defines all the use cases for different types of users (viewers, creators, admins) and system processes.",
        "entity-relationship": "Database schema showing entities, attributes, and relationships between data models.",
        "sequence-channel-creation":
            "Step-by-step sequence of creating a new streaming channel including AWS provisioning.",
        "state-channel-lifecycle": "State machine showing all possible states of a streaming channel and transitions.",
        "network-architecture": "Network topology showing how different services and infrastructure components connect.",
        "deployment-architecture": "Deployment view showing how the application is hosted across different platforms.",
        "user-journey": "User experience flow from landing page through channel creation and streaming management.",
    }
    return descriptions[name] || "System diagram for Ferdi Live streaming platform."
}

// Run the generator
generateDiagramImages().catch(console.error)
