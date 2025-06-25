"use client"

import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <div className="p-6">{children}</div>
                </main>
            </div>
        </AuthGuard>
    )
}
