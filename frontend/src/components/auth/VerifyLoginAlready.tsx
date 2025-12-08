'use client';
import { useCurrentUser } from '@/lib/react-query/queries/userQueries';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const defaultPagePreventAccessAfterLogin = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-email-notification',
  '/resend-verification',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/change-email',
];
export default function VerifyLoginAlready({ children }: { children: React.ReactNode }) {
  const { data: currentUser, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    if (
      isMounted &&
      !isLoading &&
      currentUser &&
      defaultPagePreventAccessAfterLogin.includes(pathname)
    ) {
      router.back();
    }
  }, [currentUser, isLoading, router, pathname, isMounted]);

  if (isLoading || !isMounted) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return children;
}
