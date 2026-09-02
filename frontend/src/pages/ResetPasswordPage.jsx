import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  KeyRound,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import useAuth from '../features/auth/useAuth.js'
import {
  resetPassword as submitPasswordReset,
} from '../features/auth/passwordApi.js'
import {
  resetPasswordSchema,
} from '../features/auth/passwordValidation.js'
import { getApiErrorMessage } from '../lib/errors.js'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { clearSession } = useAuth()

  const token = searchParams.get('token')?.trim() || ''
  const hasValidTokenFormat = /^[a-f0-9]{64}$/i.test(token)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    setServerError('')

    try {
      const response = await submitPasswordReset({
        token,
        newPassword: values.newPassword,
      })

      clearSession()
      setSuccessMessage(response.message)
    } catch (error) {
      setServerError(
        getApiErrorMessage(
          error,
          'Unable to reset your password.',
        ),
      )
    }
  }

  if (!hasValidTokenFormat) {
    return (
      <main className="page-shell grid min-h-[70vh] place-items-center py-12">
        <section className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-7 text-center shadow-[0_20px_60px_rgba(28,44,36,0.08)] sm:p-9">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-red-100 text-red-700">
            <CircleAlert size={23} />
          </span>

          <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] text-stone-900">
            Invalid reset link
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            This password-reset link is missing its token or is
            incorrectly formatted.
          </p>

          <Link
            to="/forgot-password"
            className="focus-ring mt-7 flex w-full items-center justify-center rounded-xl bg-emerald-950 px-5 py-4 font-black text-white"
          >
            Request another reset link
          </Link>
        </section>
      </main>
    )
  }

  if (successMessage) {
    return (
      <main className="page-shell grid min-h-[70vh] place-items-center py-12">
        <section className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-7 text-center shadow-[0_20px_60px_rgba(28,44,36,0.08)] sm:p-9">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-emerald-100 text-emerald-900">
            <CheckCircle2 size={23} />
          </span>

          <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] text-stone-900">
            Password reset complete
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            {successMessage}
          </p>

          <Link
            to="/login"
            className="focus-ring mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-4 font-black text-white"
          >
            Log in with your new password
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell grid min-h-[70vh] place-items-center py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-7 shadow-[0_20px_60px_rgba(28,44,36,0.08)] sm:p-9">
        <span className="mb-5 grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <KeyRound size={21} />
        </span>

        <p className="eyebrow">Secure your account</p>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Create a new password
        </h1>

        <p className="mt-3 text-sm leading-6 text-stone-500">
          This reset link can only be used once and expires after
          15 minutes.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-7 space-y-5"
        >
          <label className="block text-sm font-bold text-stone-700">
            New password

            <input
              type="password"
              autoComplete="new-password"
              {...register('newPassword')}
              className="focus-ring mt-2 w-full rounded-xl border border-stone-300 px-4 py-3.5 font-normal"
            />

            {errors.newPassword && (
              <span className="mt-1.5 block text-xs font-semibold text-red-600">
                {errors.newPassword.message}
              </span>
            )}
          </label>

          <label className="block text-sm font-bold text-stone-700">
            Confirm new password

            <input
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="focus-ring mt-2 w-full rounded-xl border border-stone-300 px-4 py-3.5 font-normal"
            />

            {errors.confirmPassword && (
              <span className="mt-1.5 block text-xs font-semibold text-red-600">
                {errors.confirmPassword.message}
              </span>
            )}
          </label>

          <p className="text-xs leading-5 text-stone-400">
            Use 12–128 characters with uppercase, lowercase,
            number, and special characters.
          </p>

          {serverError && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Resetting password…'
              : 'Reset password'}

            <ArrowRight size={18} />
          </button>
        </form>
      </section>
    </main>
  )
}

export default ResetPasswordPage