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
import { useResendVerificationEmail } from '@/lib/react-query/queries/userQueries';
import { useAuthStore } from '@/lib/store/authStore';
import { CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
export default function VerifyEmailNotificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { user: currentUser } = useAuthStore();
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const resendMutation = useResendVerificationEmail();

  const handleResend = async () => {
    try {
      setResendError(null);
      setResendSuccess(false);

      const emailToUse = email || currentUser?.email;
      if (!emailToUse) {
        setResendError('Email address is required');
        return;
      }

      await resendMutation.mutateAsync(emailToUse);
      setResendSuccess(true);
      // Clear success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: unknown) {
      let errorMessage = 'Failed to resend verification email. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }
      setResendError(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent a verification email to{' '}
            {email ? (
              <span className="font-semibold text-foreground">{email}</span>
            ) : (
              'your email address'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium">Next steps:</p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Return here after verification</li>
            </ol>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
            <div className="mt-0.5">
              <CheckCircle2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Important</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                The verification link expires in 5 minutes. If you don't see the email, check your
                spam folder or resend it.
              </p>
            </div>
          </div>

          {resendSuccess && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              Verification email sent successfully! Please check your inbox.
            </div>
          )}

          {resendError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {resendError}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={handleResend}
            disabled={resendMutation.isPending}
            variant="outline"
            className="w-full"
          >
            {resendMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>
          <Button onClick={() => router.push('/login')} variant="ghost" className="w-full">
            Back to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
