import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'

interface LoginFormData {
  email: string
  password: string
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' })
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(formData.email, formData.password)
      window.location.href = '/'
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 flex-col justify-center px-12">
        <div className="max-w-md">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6">
            <span className="text-primary-900 font-bold text-xl">A</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            African Agricultural Trade Operating System
          </h1>
          <p className="text-primary-200 text-lg">
            The infrastructure for global agricultural trade. Connect, verify, and complete
            trade with confidence.
          </p>
          <div className="mt-8 flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">50+</p>
              <p className="text-primary-300 text-sm">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-primary-300 text-sm">Suppliers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">$100M+</p>
              <p className="text-primary-300 text-sm">Trade Volume</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16">
        <div className="max-w-sm mx-auto w-full">
          <div className="lg:hidden mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-gray-600">
            Welcome back! Please enter your details.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input pl-10"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2.5"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="#" className="text-primary-600 font-medium hover:text-primary-700">
              Get started
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
text-primary-700">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
