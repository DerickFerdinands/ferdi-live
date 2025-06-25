"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Play, BarChart3, CreditCard, Settings, Shield, Menu, X, LogOut, User, Crown, Zap } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Channels", href: "/dashboard", icon: Play },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const adminNavigation = [{ name: "Admin Panel", href: "/admin", icon: Shield }]

export function Sidebar() {
  const pathname = usePathname()
  const { user, userData, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const userPlan = userData?.subscription?.plan || "basic"
  // @ts-ignore
  const isAdmin = userData?.role === "admin"

  const handleSignOut = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getPlanIcon = () => {
    switch (userPlan) {
      case "enterprise":
        return <Crown className="h-3 w-3 text-yellow-600" />
      case "pro":
        return <Zap className="h-3 w-3 text-blue-600" />
      default:
        return null
    }
  }

  const getPlanName = () => {
    switch (userPlan) {
      case "enterprise":
        return "Enterprise"
      case "pro":
        return "Pro"
      default:
        return "Basic"
    }
  }

  const sidebarContent = (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <Play className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">Ferdi Live</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
                <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    )}
                    onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
            )
          })}

          {/* Admin Navigation */}
          {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</div>
                </div>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                      <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              isActive ? "bg-red-100 text-red-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                          )}
                          onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                  )
                })}
              </>
          )}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{user?.displayName || "User"}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {getPlanIcon()}
                    {getPlanName()}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.displayName || "User"}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <div className="flex items-center gap-1">
                    <Badge variant={userPlan === "basic" ? "secondary" : "default"} className="text-xs">
                      {getPlanIcon()}
                      {getPlanName()}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
  )

  return (
      <>
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white shadow-md">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div
            className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
        >
          {sidebarContent}
        </div>
      </>
  )
}
