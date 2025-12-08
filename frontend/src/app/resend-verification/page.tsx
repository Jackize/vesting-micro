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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrentUser, useResendVerificationEmail } from '@/lib/react-query/queries/userQueries';
import { Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResendVerificationPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const [email, setEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const resendMutation = useResendVerificationEmail();

  // Pre-fill email if user is authenticated
  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResendError(null);
      setResendSuccess(false);

      if (!email) {
        setResendError('Please enter your email address');
        return;
      }

      await resendMutation.mutateAsync(email);
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
          <CardTitle className="text-2xl">Resend Verification Email</CardTitle>
          <CardDescription>
            Enter your email address to receive a new verification email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={!!currentUser?.email}
                className={currentUser?.email ? 'bg-muted' : ''}
              />
              {currentUser?.email && (
                <p className="text-xs text-muted-foreground">Using your account email address</p>
              )}
            </div>

            {resendSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                Verification email sent successfully! Please check your inbox (and spam folder).
              </div>
            )}

            {resendError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {resendError}
              </div>
            )}

            <Button type="submit" disabled={resendMutation.isPending || !email} className="w-full">
              {resendMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Email
                </>
              )}
            </Button>
          </form>

          <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
            <div className="mt-0.5">
              <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Important</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                The verification link expires in 24 hours. If you don't see the email, check your
                spam folder.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Back to login</Link>
          </Button>
          {currentUser && (
            <Button asChild variant="ghost" className="w-full">
              <Link href="/profile">Go to profile</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
