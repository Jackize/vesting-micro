'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegister } from '@/lib/react-query/queries/userQueries';
import { registerSchema, type RegisterFormData } from '@/lib/validations/userSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useForm } from 'react-hook-form';
export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [error, setError] = useState<string | null>(null);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit', // Validate on submit
    reValidateMode: 'onSubmit', // Re-validate on submit
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (!executeRecaptcha) {
        setError('Captcha is not loaded');
        return;
      }
      setError(null);
      const token = await executeRecaptcha('submit_form');
      if (!token) {
        setError('Captcha token is required');
        return;
      }
      data.captchaToken = token;
      // This will trigger refetch of current user data in the mutation's onSuccess
      const result = await registerMutation.mutateAsync(data);
      // Navigate to verification email notification page with user email
      router.push(`/verify-email-notification?email=${encodeURIComponent(result.user.email)}`);
    } catch (err: unknown) {
      let errorMessage = 'Registration failed. Please try again.';

      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)(e);
          }}
        >
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...register('firstName')} className="mt-1" />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...register('lastName')} className="mt-1" />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className="mt-1"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                {...register('phone')}
                className="mt-1"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
