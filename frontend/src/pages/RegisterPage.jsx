import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import useAuth from '../features/auth/useAuth.js'
import { getApiErrorMessage } from '../lib/errors.js'

const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[0-9]/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a special character')

const registerSchema = z.object({
  name: z.string().trim().min(3, 'Enter your full name').max(100),
  email: z.email('Enter a valid email address'),
  phone: z.string().trim().min(7, 'Enter a valid phone number').max(20),
  password: passwordSchema,
})

function RegisterPage() {
  const [serverError, setServerError] = useState('')
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values) => {
    setServerError('')

    try {
      await registerAccount(values)
      toast.success('Account created. You can now log in.')
      navigate('/login', { replace: true })
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to create your account.'))
    }
  }

  return (
    <main className="page-shell grid min-h-[70vh] place-items-center py-12">
      <section className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-7 shadow-[0_20px_60px_rgba(28,44,36,0.08)] sm:p-9">
        <span className="mb-5 grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <UserPlus size={21} />
        </span>
        <p className="eyebrow">Create your account</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Start your property journey
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          Every account starts as a regular user. You can apply to become an agent after logging in.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 grid gap-5 sm:grid-cols-2">
          {[
            ['name', 'Full name', 'text', 'name'],
            ['phone', 'Phone number', 'tel', 'tel'],
            ['email', 'Email address', 'email', 'email'],
            ['password', 'Password', 'password', 'new-password'],
          ].map(([name, label, type, autoComplete]) => (
            <label
              key={name}
              className={`block text-sm font-bold text-stone-700 ${
                name === 'email' || name === 'password' ? 'sm:col-span-2' : ''
              }`}
            >
              {label}
              <input
                type={type}
                autoComplete={autoComplete}
                {...register(name)}
                className="focus-ring mt-2 w-full rounded-xl border border-stone-300 px-4 py-3.5 font-normal"
              />
              {errors[name] && (
                <span className="mt-1.5 block text-xs font-semibold text-red-600">
                  {errors[name].message}
                </span>
              )}
            </label>
          ))}

          <p className="text-xs leading-5 text-stone-400 sm:col-span-2">
            Use at least 12 characters with uppercase, lowercase, number, and special characters.
          </p>
          {serverError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:col-span-2">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'} <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already registered?{' '}
          <Link to="/login" className="font-extrabold text-emerald-800">
            Log in
          </Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
