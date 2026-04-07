'use client'

import { Calendar, Home, Inbox, Users, Shield, LogOut, User, Settings, Users2, LayoutGrid, LockOpen } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Uploads", url: "/dashboard/upload", icon: Inbox },
  { title: "History", url: "/dashboard/history", icon: Calendar },
  { title: "Team Members", url: "/dashboard/team-members", icon: Users },
  { title: "User Groups", url: "/dashboard/user-groups", icon: Users2 },
  { title: "Roles", url: "/dashboard/roles", icon: LockOpen },
  { title: "Permissions", url: "/dashboard/permissions", icon: Shield },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
]

function CleanStreamMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top leaf - green */}
      <path d="M20 4 C23 4 26 8 26 13 C26 18 23 20 20 20 C17 20 14 18 14 13 C14 8 17 4 20 4Z" fill="#4caf72" />
      {/* Bottom-left leaf - dark */}
      <path d="M20 4 C23 4 26 8 26 13 C26 18 23 20 20 20 C17 20 14 18 14 13 C14 8 17 4 20 4Z" fill="#1a1a1a"
        transform="rotate(120 20 20)" />
      {/* Bottom-right leaf - gray */}
      <path d="M20 4 C23 4 26 8 26 13 C26 18 23 20 20 20 C17 20 14 18 14 13 C14 8 17 4 20 4Z" fill="#7a9a9a"
        transform="rotate(240 20 20)" />
    </svg>
  )
}

export function AppSidebar() {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/dashboard"
  const { user, logout } = useAuth()
  console.log(user)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <Sidebar className="border-r border-teal-900 [&>div]:bg-[#1b5e5e] flex flex-col rounded-br-2xl rounded-r-2xl">
      <SidebarContent className="p-5  flex-1 rounded-r-2xl">
        <SidebarGroup>
          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-8 px-2 pt-2">
            <CleanStreamMark />
            <SidebarGroupLabel className="text-[#c8f5a0] text-lg font-bold uppercase tracking-widest">
              Clean Stream
            </SidebarGroupLabel>
            <p className="text-[#7ed957] text-[9px] font-semibold uppercase tracking-widest -mt-3">
              Tech That Clears The Way
            </p>
          </div>

          <SidebarGroupContent className="rounded-r-2xl">
            <SidebarMenu className="space-y-1 rounded-r-2xl">
              {items.map((item) => {
                const isActive = currentPath === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <a
                      
                        href={item.url}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-r-xl rounded-l-sm transition-all duration-200 border-l-[3px] ${
                          isActive
                            ? "bg-[rgba(126,217,87,0.18)] border-[#7ed957]"
                            : "border-transparent hover:bg-teal-700/40"
                        }`}
                      >
                        <item.icon
                          className={`w-5 h-5 transition-colors duration-200 ${
                            isActive
                              ? "text-[#7ed957]"
                              : "text-[#a8d8b0] group-hover:text-green-300"
                          }`}
                          strokeWidth={2}
                        />
                        <span
                          className={`text-sm transition-colors duration-200 ${
                            isActive
                              ? "text-[#c8f5a0] font-semibold"
                              : "text-[#a8d8b0] font-medium group-hover:text-green-100"
                          }`}
                        >
                          {item.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>

          {/* Admin Section - Only for Platform Admins */}
          {user?.orgRole?.name === 'PLATFORM_ADMIN'&& (
            <>
              <SidebarGroup className="mt-6 pt-4 border-t border-teal-700">
                <SidebarGroupLabel className="text-[#c8f5a0]">Platform Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {[{ title: "Admin Panel", url: "/admin", icon: LayoutGrid }].map((item) => {
                      const isActive = currentPath === item.url
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <a
                              href={item.url}
                              className={`group flex items-center gap-3 px-4 py-3 rounded-r-xl rounded-l-sm transition-all duration-200 border-l-[3px] ${
                                isActive
                                  ? "bg-[rgba(126,217,87,0.18)] border-[#7ed957]"
                                  : "border-transparent hover:bg-teal-700/40"
                              }`}
                            >
                              <item.icon
                                className={`w-5 h-5 transition-colors duration-200 ${
                                  isActive
                                    ? "text-[#7ed957]"
                                    : "text-[#a8d8b0] group-hover:text-green-300"
                                }`}
                                strokeWidth={2}
                              />
                              <span
                                className={`text-sm transition-colors duration-200 ${
                                  isActive
                                    ? "text-[#c8f5a0] font-semibold"
                                    : "text-[#a8d8b0] font-medium group-hover:text-green-100"
                                }`}
                              >
                                {item.title}
                              </span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Section */}
      <div className="border-t border-teal-700 p-4 bg-[#164d4d] rounded-r-2xl">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-teal-700/50 transition-colors duration-200 group"
          >
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#7ed957] to-[#4caf72] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[#c8f5a0] text-sm font-semibold truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[#7ed957] text-xs truncate">
                {user?.currentOrg?.name || 'Organization'}
              </p>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0f3a3a] border border-teal-600 rounded-lg shadow-lg overflow-hidden z-50">
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  logout()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#ff6b6b] hover:bg-red-900/30 transition-colors duration-200 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  )
}

export default AppSidebar