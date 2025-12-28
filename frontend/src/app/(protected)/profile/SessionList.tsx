import { Button } from '@/components/ui/button';
import { useLogout, useUserSessions } from '@/lib/react-query/queries/userQueries';
import { useAuthStore } from '@/lib/store/authStore';
import Cookies from 'js-cookie';
import { LogOut, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useEffect } from 'react';

const SessionList = ({
  handleLogout,
}: {
  handleLogout: (type: 'current' | 'all' | string) => void;
}) => {
  // Poll sessions every 3 seconds to detect when current session is logged out
  const { data: sessionsData } = useUserSessions({ refetchInterval: 3000 });
  const errorLogout = useAuthStore((state) => state.error);
  const logoutMutation = useLogout();

  const getDeviceIcon = (deviceInfo?: { platform?: string; userAgent?: string }) => {
    const platform = deviceInfo?.platform?.toLowerCase() || '';
    const userAgent = deviceInfo?.userAgent?.toLowerCase() || '';

    if (platform.includes('mobile') || userAgent.includes('mobile')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (platform.includes('tablet') || userAgent.includes('tablet')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  // Check if current session still exists in the sessions list
  // If not, it means this session was logged out from another browser
  // This runs continuously to detect when session is logged out
  useEffect(() => {
    if (!sessionsData?.sessions) {
      return;
    }

    const currentSessionId = Cookies.get('session_id');
    if (!currentSessionId) {
      return;
    }

    // Check if current session exists in the list
    const currentSessionExists = sessionsData.sessions.some(
      (session) => session.sessionId === currentSessionId || session.isCurrent
    );

    // If sessions list is not empty but current session doesn't exist, it was logged out
    if (!currentSessionExists && sessionsData.sessions.length > 0) {
      handleLogout('current');
    }
  }, [sessionsData, handleLogout]);
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Active Sessions</h2>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleLogout('all')}
          disabled={logoutMutation.isPending}
        >
          Logout All
        </Button>
      </div>
      {errorLogout && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errorLogout}
        </div>
      )}
      {sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
        <div className="space-y-3">
          {sessionsData.sessions.map((session) => {
            return (
              <div
                key={session.sessionId}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.deviceInfo)}
                  <div>
                    <p className="font-medium">
                      {session.deviceInfo?.platform || session.sessionId || 'Unknown Device'}
                      {session.isCurrent && (
                        <span className="ml-2 text-xs text-primary">(Current)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.deviceInfo?.userAgent
                        ? session.deviceInfo.userAgent.substring(0, 50) + '...'
                        : 'Unknown browser'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last used:{' '}
                      {session.lastUsedAt ? new Date(session.lastUsedAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLogout(session.sessionId)}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-3 w-3" />
                    Logout
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No active sessions found.</p>
      )}
    </div>
  );
};

export default SessionList;
