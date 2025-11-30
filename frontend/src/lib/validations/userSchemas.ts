import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, 'Please provide a valid phone number')
    .optional()
    .or(z.literal('')),
  captchaToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long').optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, 'Please provide a valid phone number')
    .optional()
    .or(z.literal('')),
  avatar: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
