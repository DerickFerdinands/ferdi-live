import { FirebaseStatus } from "@/components/firebase-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DebugPage() {
  const envVars = [
    { name: "NEXT_PUBLIC_FIREBASE_API_KEY", value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY },
    { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN },
    { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
    { name: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET },
    { name: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID },
    { name: "NEXT_PUBLIC_FIREBASE_APP_ID", value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID },
    { name: "NEXT_PUBLIC_FIREBASE_DATABASE_URL", value: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Debug Information</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <FirebaseStatus />

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Check if all required Firebase variables are set</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {envVars.map((envVar) => (
                  <div key={envVar.name} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{envVar.name}</span>
                    <Badge variant={envVar.value ? "default" : "destructive"}>{envVar.value ? "Set" : "Missing"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Follow these steps to configure Firebase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <h4>1. Create a Firebase Project</h4>
              <p>
                Go to the{" "}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  Firebase Console
                </a>{" "}
                and create a new project.
              </p>

              <h4>2. Enable Authentication</h4>
              <p>In your Firebase project, go to Authentication → Sign-in method and enable Email/Password.</p>

              <h4>3. Create Firestore Database</h4>
              <p>Go to Firestore Database and create a database in production mode.</p>

              <h4>4. Get Configuration</h4>
              <p>Go to Project Settings → General → Your apps and copy the Firebase config object.</p>

              <h4>5. Set Environment Variables</h4>
              <p>
                Add the Firebase configuration values to your environment variables in Vercel or your .env.local file.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
