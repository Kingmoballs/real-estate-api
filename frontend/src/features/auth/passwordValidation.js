import { z } from 'zod'

export const strongPasswordSchema = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(128, 'Use no more than 128 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[0-9]/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a special character')

export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine(
    (values) => values.newPassword === values.confirmPassword,
    {
      message: 'The passwords do not match',
      path: ['confirmPassword'],
    },
  )

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Enter your current password')
      .max(128, 'Password is too long'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine(
    (values) => values.newPassword === values.confirmPassword,
    {
      message: 'The passwords do not match',
      path: ['confirmPassword'],
    },
  )
  .refine(
    (values) => values.currentPassword !== values.newPassword,
    {
      message: 'Your new password must be different',
      path: ['newPassword'],
    },
  )