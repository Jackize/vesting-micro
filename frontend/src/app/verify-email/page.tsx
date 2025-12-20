'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { userApi } from '@/lib/api/userApi';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) {
      return;
    }
    hasVerified.current = true;
    const verifyEmail = async () => {
      if (token === null) return;

      try {
        const response = await userApi.verifyEmail(token);
        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(response.message || 'Failed to verify email. The link may have expired.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {status === 'success' && (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          )}
          {status === 'error' && (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          )}
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying email...'}
            {status === 'success' && 'Email verified!'}
            {status === 'error' && 'Verification failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'error' && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                If your verification link has expired, you can request a new one from your profile
                settings or contact support.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {status === 'success' && (
            <Button asChild className="w-full">
              <Link href="/login">Go to login</Link>
            </Button>
          )}
          {status === 'error' && (
            <>
              <Button asChild className="w-full" variant="outline">
                <Link href="/login">Back to login</Link>
              </Button>
              <Button asChild className="w-full" variant="ghost">
                <Link href="/verify-email-notification">Resend verification email</Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
