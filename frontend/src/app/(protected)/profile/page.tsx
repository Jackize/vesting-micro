'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useChangePassword,
  useCurrentUser,
  useUpdateProfile,
} from '@/lib/react-query/queries/userQueries';
import { useAuthStore } from '@/lib/store/authStore';
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormData,
  type UpdateProfileFormData,
} from '@/lib/validations/userSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const logout = useAuthStore((state) => state.logout);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user, reset]);

  // Redirect to login if user is not authenticated (after mount)
  useEffect(() => {
    if (isMounted && !isLoading && (isError || !user)) {
      router.push('/login');
    }
  }, [isMounted, user, isLoading, isError, router]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      setError(null);
      setSuccess(null);
      await updateProfileMutation.mutateAsync(data);
      setSuccess('Profile updated successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to update profile. Please try again.');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    try {
      setPasswordError(null);
      setPasswordSuccess(null);
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess('Password changed successfully! You will be logged out...');
      resetPasswordForm();
      // Redirect to login after a short delay to show success message
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message || 'Failed to change password. Please try again.');
      } else {
        setPasswordError('An unexpected error occurred');
      }
    }
  };

  // Show loading state during initial mount and data fetching
  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render content if user is not authenticated (redirect will happen)
  if (isError || !user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Personal Information</h2>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                {success}
              </div>
            )}

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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled className="mt-1" />
              <p className="mt-1 text-sm text-muted-foreground">Email cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register('phone')} className="mt-1" />
              {errors.phone && (
                <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input id="avatar" type="url" {...register('avatar')} className="mt-1" />
              {errors.avatar && (
                <p className="mt-1 text-sm text-destructive">{errors.avatar.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Change Password</h2>
          <form className="space-y-4" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            {passwordError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                {passwordSuccess}
              </div>
            )}

            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...registerPassword('currentPassword')}
                className="mt-1"
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-destructive">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword('newPassword')}
                className="mt-1"
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-destructive">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerPassword('confirmPassword')}
                className="mt-1"
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isPasswordSubmitting}>
              {isPasswordSubmitting ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Account Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Role:</span> {user.role}
            </p>
            <p>
              <span className="font-medium">Status:</span>{' '}
              {user.isActive ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-red-600">Inactive</span>
              )}
            </p>
            <p>
              <span className="font-medium">Email Verified:</span>{' '}
              {user.isEmailVerified ? (
                <span className="text-green-600">Verified</span>
              ) : (
                <span className="text-yellow-600">Not Verified</span>
              )}
            </p>
            {user.lastLogin && (
              <p>
                <span className="font-medium">Last Login:</span>{' '}
                {new Date(user.lastLogin).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
