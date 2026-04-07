"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

/**
 * Protected Route Component
 *
 * Wraps components to ensure user is authenticated.
 * Optionally checks for specific permissions.
 *
 * Usage:
 * <ProtectedRoute requiredPermissions={['users:write']}>
 *   <YourComponent />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredPermissions,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // Check permissions if required
    if (requiredPermissions && requiredPermissions.length > 0 && user) {
      // ✅ Allow platform admin full access
      if (user.isPlatformAdmin) return;

      const userPermissions = user?.permissions || [];

      const hasPermissions = requiredPermissions.every((perm) =>
        userPermissions.includes(perm),
      );

      if (!hasPermissions) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, requiredPermissions, router]);

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}
