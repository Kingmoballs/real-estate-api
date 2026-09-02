import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  MailCheck,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import {
  forgotPasswordSchema,
} from '../features/auth/passwordValidation.js'
import {
  requestPasswordReset,
} from '../features/auth/passwordApi.js'
import { getApiErrorMessage } from '../lib/errors.js'

function ForgotPasswordPage() {
  const [serverError, setServerError] = useState('')
  const [result, setResult] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values) => {
    setServerError('')

    const email = values.email.trim().toLowerCase()

    try {
      const response = await requestPasswordReset(email)

      setResult({
        email,
        message: response.message,
      })
    } catch (error) {
      setServerError(
        getApiErrorMessage(
          error,
          'Unable to request a password reset.',
        ),
      )
    }
  }

  if (result) {
    return (
      <main className="page-shell grid min-h-[70vh] place-items-center py-12">
        <section className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-7 text-center shadow-[0_20px_60px_rgba(28,44,36,0.08)] sm:p-9">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-emerald-100 text-emerald-900">
            <MailCheck size={23} />
          </span>

          <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] text-stone-900">
            Check your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            {result.message}
          </p>

          <p className="mt-3 text-sm font-bold text-stone-700">
            {result.email}
          </p>

          <p className="mt-4 text-xs leading-5 text-stone-400">
            The reset link expires after 15 minutes. Check your
            spam folder if you cannot find the email.
          </p>

          <Link
            to="/login"
            className="focus-ring mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-4 font-black text-white"
          >
            <ArrowLeft size={18} />
            Return to login
          </Link>

          <button
            type="button"
            onClick={() => {
              setResult(null)
              reset()
            }}
            className="focus-ring mt-3 cursor-pointer text-sm font-extrabold text-emerald-800"
          >
            Try another email
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell grid min-h-[70vh] place-items-center py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-7 shadow-[0_20px_60px_rgba(28,44,36,0.08)] sm:p-9">
        <span className="mb-5 grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-900">
          <MailCheck size={21} />
        </span>

        <p className="eyebrow">Account recovery</p>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Forgot your password?
        </h1>

        <p className="mt-3 text-sm leading-6 text-stone-500">
          Enter your email address. If an active account exists,
          we will send a secure password-reset link.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-7 space-y-5"
        >
          <label className="block text-sm font-bold text-stone-700">
            Email address

            <input
              type="email"
              autoComplete="email"
              autoFocus
              {...register('email')}
              className="focus-ring mt-2 w-full rounded-xl border border-stone-300 px-4 py-3.5 font-normal"
            />

            {errors.email && (
              <span className="mt-1.5 block text-xs font-semibold text-red-600">
                {errors.email.message}
              </span>
            )}
          </label>

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
              ? 'Sending reset link…'
              : 'Send reset link'}

            <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Remembered your password?{' '}

          <Link
            to="/login"
            className="font-extrabold text-emerald-800"
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  )
}

export default ForgotPasswordPage