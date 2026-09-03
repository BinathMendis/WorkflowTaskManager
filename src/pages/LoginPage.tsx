import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye, EyeOff, LogIn, CheckSquare, Loader2, ShieldCheck, ListChecks, Bell,
} from 'lucide-react'
import { login as apiLogin } from '../api/authService'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('')
    setIsLoading(true)
    try {
      const res = await apiLogin(values)
      await login(res)
      toast.success(`Welcome back, ${res.username}!`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setServerError(msg || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-red-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[620px] bg-black px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.32),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(127,29,29,0.26),transparent_28%)]" />
          <div className="relative">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-600/30">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold">Task Management System</p>
                <p className="text-xs text-slate-400">by Dio Global Solutions</p>
              </div>
            </div>

            <div className="max-w-sm">
              <p className="mb-3 text-sm font-medium text-red-300">Secure workspace</p>
              <h1 className="text-4xl font-bold leading-tight">Manage work, approvals, and publishing from one place.</h1>
              <p className="mt-5 text-sm leading-6 text-slate-400">
                Sign in to continue to your dashboard, review task progress, and keep team handoffs moving.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <ListChecks className="h-5 w-5 text-red-300" />
              <span className="text-sm text-slate-200">Track assigned work and deadlines</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-red-300" />
              <span className="text-sm text-slate-200">Review approvals with role-based access</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <Bell className="h-5 w-5 text-red-300" />
              <span className="text-sm text-slate-200">Stay current with task notifications</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-12 lg:px-12">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-600/25">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management System</h1>
            <p className="mt-1 text-sm text-gray-500">by Dio Global Solutions</p>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium text-red-600">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-2 text-sm text-gray-500">Use your team account to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm pr-11 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors shadow-md shadow-red-600/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
