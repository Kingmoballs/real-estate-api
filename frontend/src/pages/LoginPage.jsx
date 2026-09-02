import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import useAuth from '../features/auth/useAuth.js'
import { getApiErrorMessage } from '../lib/errors.js'

const getDashboardPath = (role) => {
  if (role === 'agent') return '/agent'
  if (role === 'admin') return '/admin'
  return '/account'
}

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

function LoginPage() {
  const [serverError, setServerError] = useState('')
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  if (user) return <Navigate to={getDashboardPath(user.role)} replace />

  const onSubmit = async (values) => {
    setServerError('')

    try {
      const signedInUser = await login(values)
      toast.success(`Welcome back, ${signedInUser.name.split(' ')[0]}`)
      navigate(
        location.state?.from?.pathname || getDashboardPath(signedInUser.role),
        { replace: true },
      )
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to log in.'))
    }
  }

  return (
    <main className="page-shell grid min-h-[70vh] place-items-center py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-7 shadow-[0_20px_60px_rgba(28,44,36,0.08)] sm:p-9">
        <span className="mb-5 grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-900">
          <LockKeyhole size={21} />
        </span>
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Log in to Haven
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          Users, agents, and administrators use the same secure login.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <label className="block text-sm font-bold text-stone-700">
            Email address
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="focus-ring mt-2 w-full rounded-xl border border-stone-300 px-4 py-3.5 font-normal"
            />
            {errors.email && (
              <span className="mt-1.5 block text-xs font-semibold text-red-600">
                {errors.email.message}
              </span>
            )}
          </label>
          <label className="block text-sm font-bold text-stone-700">
            Password
            <input
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="focus-ring mt-2 w-full rounded-xl border border-stone-300 px-4 py-3.5 font-normal"
            />
            {errors.password && (
              <span className="mt-1.5 block text-xs font-semibold text-red-600">
                {errors.password.message}
              </span>
            )}
          </label>

          {serverError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Logging in…' : 'Log in'} <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          New to Haven?{' '}
          <Link to="/register" className="font-extrabold text-emerald-800">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
