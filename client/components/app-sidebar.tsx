import { Calendar, Home, Inbox, Waves } from "lucide-react"

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

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Uploads",
    url: "/dashboard/upload",
    icon: Inbox,
  },
  {
    title: "History",
    url: "/dashboard/history",
    icon: Calendar,
  },
]

export function AppSidebar() {
  // Get current path - you can also pass this as a prop
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
  
  return (
    <Sidebar className="border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white">
      <SidebarContent className="p-6">
        <SidebarGroup>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Waves className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <SidebarGroupLabel className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              CleanStream
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="group">
                      <a 
                        href={item.url}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30' 
                            : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-sm'
                        }`}
                      >
                        <div className={`p-2 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? 'bg-white/20 shadow-md' 
                            : 'bg-slate-100 group-hover:bg-white group-hover:shadow-md'
                        }`}>
                          <item.icon 
                            className={`w-5 h-5 transition-colors duration-200 ${
                              isActive 
                                ? 'text-white' 
                                : 'text-slate-600 group-hover:text-blue-600'
                            }`} 
                            strokeWidth={2}
                          />
                        </div>
                        <span className={`text-base font-medium transition-colors duration-200 ${
                          isActive 
                            ? 'text-white font-semibold' 
                            : 'text-slate-700 group-hover:text-slate-900'
                        }`}>
                          {item.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar;