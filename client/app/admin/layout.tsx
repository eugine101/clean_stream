'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is platform admin
    const isPlatformAdmin = user?.orgRole?.name === 'PLATFORM_ADMIN';
    if (!isPlatformAdmin && user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full" />
        </div>
      </div>
    );
  }

  const isPlatformAdmin = user?.orgRole?.name === 'PLATFORM_ADMIN';

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Access Denied</h3>
                <p className="text-sm text-red-800">
                  You don't have permission to access the admin platform. Contact your system administrator if you believe this is an error.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
