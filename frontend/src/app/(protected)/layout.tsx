'use client';

import { useCurrentUser, useUserSessions } from '@/lib/react-query/queries/userQueries';
import Cookies from 'js-cookie';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUser();
  const [mounted, setMounted] = useState(false);

  // Poll sessions to detect if current session was logged out from another browser
  const { data: sessionsData } = useUserSessions({
    refetchInterval: 3000, // Check every 3 seconds
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication and session validity
  useEffect(() => {
    if (mounted && !isLoading) {
      const sessionId = Cookies.get('session_id');
      if (!user || !sessionId) {
        router.replace('/login');
        Cookies.remove('auth_token');
        Cookies.remove('refresh_token');
        Cookies.remove('session_id');
      }
    }
  }, [user, isLoading, router, mounted]);

  // Check if current session still exists (was logged out from another browser)
  // This runs continuously to detect when session is logged out from another browser
  useEffect(() => {
    if (!mounted || isLoading || !sessionsData?.sessions) {
      return;
    }

    const currentSessionId = Cookies.get('session_id');
    if (!currentSessionId) {
      return;
    }

    // Check if current session exists in the sessions list
    const currentSessionExists = sessionsData.sessions.some(
      (session) => session.sessionId === currentSessionId || session.isCurrent
    );

    // If sessions list is not empty but current session doesn't exist, it was logged out
    if (!currentSessionExists && sessionsData.sessions.length > 0) {
      // Current session was logged out from another browser
      console.log('Session was logged out from another browser, redirecting to login...');

      // Clear cookies and logout
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      Cookies.remove('session_id');

      // Redirect to login
      router.replace('/login');
    }
  }, [sessionsData, mounted, isLoading, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
