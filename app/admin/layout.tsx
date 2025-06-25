"use client"

import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function AdminLayout({
                                      children,
                                    }: {
  children: React.ReactNode
}) {
  return (
      <AuthGuard requireAdmin>
        <DashboardSidebar>{children}</DashboardSidebar>
      </AuthGuard>
  )
}
