"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { User, Shield, CreditCard, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateProfile, updatePassword, deleteUser } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { STRIPE_PLANS } from "@/lib/stripe"

export default function SettingsPage() {
    const { user, userData, signOut } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        displayName: user?.displayName || "",
        email: user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    const userPlan = userData?.subscription?.plan || "basic"
    const planConfig = STRIPE_PLANS[userPlan as keyof typeof STRIPE_PLANS]

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: formData.displayName,
            })

            // Update Firestore user document
            if (userData) {
                const userRef = doc(db, "users", user.uid)
                await updateDoc(userRef, {
                    displayName: formData.displayName,
                    updatedAt: new Date(),
                })
            }

            toast({
                title: "Profile Updated",
                description: "Your profile has been updated successfully.",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords don't match.",
                variant: "destructive",
            })
            return
        }

        if (formData.newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        try {
            await updatePassword(user, formData.newPassword)

            setFormData({
                ...formData,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })

            toast({
                title: "Password Updated",
                description: "Your password has been updated successfully.",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update password.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!user) return

        setLoading(true)
        try {
            await deleteUser(user)
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted.",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete account.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleManageBilling = async () => {
        if (!user) return

        try {
            const token = await user.getIdToken()

            const response = await fetch("/api/create-portal-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create portal session")
            }

            if (data.url) {
                window.location.href = data.url
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to open billing portal.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                placeholder="Your display name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" value={formData.email} disabled className="bg-gray-100" />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                        <Button type="submit" disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security
                    </CardTitle>
                    <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Confirm new password"
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            <Shield className="h-4 w-4 mr-2" />
                            {loading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Subscription Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription
                        <Badge variant={userPlan === "basic" ? "secondary" : "default"}>{planConfig?.name}</Badge>
                    </CardTitle>
                    <CardDescription>Manage your subscription and billing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium">Current Plan</div>
                            <div className="text-2xl font-bold">{planConfig?.name}</div>
                            <div className="text-sm text-gray-600">${planConfig?.price}/month</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium">Status</div>
                            <div className="flex items-center gap-2">
                                <Badge variant={userData?.subscription?.status === "active" ? "default" : "secondary"}>
                                    {userData?.subscription?.status || "Free"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="text-sm font-medium">Plan Features:</div>
                        <ul className="text-sm space-y-1">
                            {planConfig?.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Button onClick={handleManageBilling} variant="outline">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Manage Billing
                    </Button>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                        <Trash2 className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-700">
                        Irreversible actions that will permanently affect your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">
                            <strong>Warning:</strong> Deleting your account will permanently remove all your data, channels, and
                            subscription. This action cannot be undone.
                        </AlertDescription>
                    </Alert>

                    <div className="mt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account and remove all your data
                                        from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
