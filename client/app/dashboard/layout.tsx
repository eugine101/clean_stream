"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppStateProvider } from "@/context/AppStateContext";
import { useAuth } from "@/lib/auth-context";

function Loader() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Main spinner */}
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <p className="text-gray-700 font-medium">Loading</p>
          <div className="flex gap-1 justify-center mt-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Check authentication status
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      router.push("/auth/login");
    } else if (!isLoading) {
      // User is authenticated, finish loading
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    // Listen for navigation events
    const handleRouteChange = () => {
      setIsNavigating(true);
      setTimeout(() => setIsNavigating(false), 500);
    };

    // Intercept link clicks for loading state
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href && !link.href.startsWith("http")) {
        handleRouteChange();
      }
    };

    document.addEventListener("click", handleClick);

    // For Next.js or React Router, you'd listen to their navigation events here
    // Example for Next.js: Router.events.on('routeChangeStart', handleRouteChange)

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);



  // If not authenticated, return null (redirect happens in useEffect)
  if (!isAuthenticated || !user) {
    return null;
  }


  return (
    <SidebarProvider>
      <AppSidebar />
      <AppStateProvider tenantId={user?.currentOrg?.id}>
        <main className="w-full">
          <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-40">
            <SidebarTrigger />
          </div>
          <div className="w-full">{children}</div>
        </main>
      </AppStateProvider>
    </SidebarProvider>
  );
}
