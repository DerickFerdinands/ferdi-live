"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface UserData {
  uid: string
  email: string
  tenantId: string
  isAdmin: boolean
  subscription?: {
    plan: string
    status: string
    channels: number
  }
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Firebase is properly configured
    if (!auth) {
      setError("Firebase is not properly configured. Please check your environment variables.")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user)
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData)
          } else {
            // Create default user data if it doesn't exist
            const defaultUserData: UserData = {
              uid: user.uid,
              email: user.email!,
              tenantId: user.uid,
              isAdmin: false,
              subscription: {
                plan: "basic",
                status: "trial",
                channels: 1,
              },
            }
            await setDoc(doc(db, "users", user.uid), defaultUserData)
            setUserData(defaultUserData)
          }
        } else {
          setUser(null)
          setUserData(null)
        }
        setError(null)
      } catch (err: any) {
        console.error("Auth state change error:", err)
        setError("Failed to authenticate. Please check your connection.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document
      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        tenantId: user.uid,
        isAdmin: false,
        subscription: {
          plan: "basic",
          status: "trial",
          channels: 1,
        },
      }

      await setDoc(doc(db, "users", user.uid), userData)
      setUserData(userData)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, error, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
