"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppStateProvider } from "@/context/AppStateContext";

function Loader() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-32 h-32 relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-xl animate-pulse"></div>

        <div className="w-full h-full relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 animate-spin blur-sm"></div>

          <div className="absolute inset-1 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
            <div className="flex gap-1 items-center">
              <div className="w-1.5 h-12 bg-cyan-500 rounded-full animate-[bounce_1s_ease-in-out_infinite]"></div>
              <div className="w-1.5 h-12 bg-blue-500 rounded-full animate-[bounce_1s_ease-in-out_infinite_0.1s]"></div>
              <div className="w-1.5 h-12 bg-indigo-500 rounded-full animate-[bounce_1s_ease-in-out_infinite_0.2s]"></div>
              <div className="w-1.5 h-12 bg-purple-500 rounded-full animate-[bounce_1s_ease-in-out_infinite_0.3s]"></div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-500/10 to-transparent animate-pulse"></div>
          </div>
        </div>

        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping delay-100"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-500 rounded-full animate-ping delay-200"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-300"></div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Initial page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

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

  if (isLoading) {
    return <Loader />;
  }

  return (
    <SidebarProvider>
      {isNavigating && <Loader />}
      <AppSidebar />
      <AppStateProvider>
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
