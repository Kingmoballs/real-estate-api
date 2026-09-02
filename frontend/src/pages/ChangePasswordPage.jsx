import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import useAuth from '../features/auth/useAuth.js'
import {
  changePasswordSchema,
} from '../features/auth/passwordValidation.js'
import { getApiErrorMessage } from '../lib/errors.js'

function ChangePasswordPage() {
  const [serverError, setServerError] = useState('')
  const { changePassword } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    setServerError('')

    try {
      const response = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      toast.success(response.message)
      navigate('/login', { replace: true })
    } catch (error) {
      setServerError(
        getApiErrorMessage(
          error,
          'Unable to change your password.',
        ),
      )
    }
  }

  return (
    <main className="page-shell py-10">
      <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-stone-200 bg-white p-7 shadow-[0_20px_60px_rgba(28,44,36,0.08)] sm:p-9">
        <span className="mb-5 grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-900">
          <ShieldCheck size={21} />
        </span>

        <p className="eyebrow">Account security</p>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Change your password
        </h1>

        <p className="mt-3 text-sm leading-6 text-stone-500">
          After changing your password, you will be logged out
          and required to sign in again.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-7 space-y-5"
        >
          <label className="block text-sm font-bold text-stone-700">
            Current password

            <input
              type="password"
              autoComplete="current-password"
              {...register('currentPassword')}
              className="focus-ring mt-2 w-full rounded-xl border border-stone-300 px-4 py-3.5 font-normal"
            />

            {errors.currentPassword && (
              <span className="mt-1.5 block text-xs font-semibold text-red-600">
                {errors.currentPassword.message}
              </span>
            )}
          </label>

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
              ? 'Changing password…'
              : 'Change password'}

            <ArrowRight size={18} />
          </button>
        </form>

        <Link
          to="/account"
          className="mt-6 block text-center text-sm font-extrabold text-emerald-800"
        >
          Return to account
        </Link>
      </section>
    </main>
  )
}

export default ChangePasswordPage