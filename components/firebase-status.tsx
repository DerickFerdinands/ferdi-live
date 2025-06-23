"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export function FirebaseStatus() {
  const [status, setStatus] = useState<{
    auth: boolean
    firestore: boolean
    config: boolean
    error?: string
  }>({
    auth: false,
    firestore: false,
    config: false,
  })

  useEffect(() => {
    const checkFirebaseStatus = async () => {
      try {
        // Check if Firebase config is present
        const configValid = !!(
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        )

        // Check Auth
        const authValid = !!auth

        // Check Firestore connection
        let firestoreValid = false
        try {
          // Try to read a test document
          await getDoc(doc(db, "test", "connection"))
          firestoreValid = true
        } catch (error: any) {
          console.warn("Firestore connection test failed:", error.message)
        }

        setStatus({
          config: configValid,
          auth: authValid,
          firestore: firestoreValid,
          error: !configValid ? "Missing Firebase environment variables" : undefined,
        })
      } catch (error: any) {
        setStatus({
          config: false,
          auth: false,
          firestore: false,
          error: error.message,
        })
      }
    }

    checkFirebaseStatus()
  }, [])

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (isValid: boolean) => {
    return <Badge variant={isValid ? "default" : "destructive"}>{isValid ? "Connected" : "Disconnected"}</Badge>
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Firebase Status
        </CardTitle>
        <CardDescription>Check your Firebase connection and configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.error && (
          <Alert variant="destructive">
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.config)}
              <span className="text-sm font-medium">Configuration</span>
            </div>
            {getStatusBadge(status.config)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.auth)}
              <span className="text-sm font-medium">Authentication</span>
            </div>
            {getStatusBadge(status.auth)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.firestore)}
              <span className="text-sm font-medium">Firestore</span>
            </div>
            {getStatusBadge(status.firestore)}
          </div>
        </div>

        {!status.config && (
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Missing Environment Variables:</strong>
              <br />• NEXT_PUBLIC_FIREBASE_API_KEY
              <br />• NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
              <br />• NEXT_PUBLIC_FIREBASE_PROJECT_ID
              <br />• NEXT_PUBLIC_FIREBASE_APP_ID
              <br />
              Please add these to your environment configuration.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
