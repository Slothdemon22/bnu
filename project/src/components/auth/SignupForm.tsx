'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Signup failed')
        setLoading(false)
        return
      }
      window.location.href = '/onboarding'
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-stone-200/50 dark:shadow-black/50">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          New Account
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tighter text-stone-900 dark:text-white">Create account</h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-gray-400 font-medium">
          Start managing projects and communication in one workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-500/30 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-bold text-stone-900 dark:text-white mb-2">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-bold text-stone-900 dark:text-white mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-bold text-stone-900 dark:text-white mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            placeholder="At least 6 characters"
          />
        </div>

        <label className="flex items-start gap-3 mt-2">
          <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500" />
          <span className="text-xs font-medium text-stone-500 dark:text-gray-400 leading-relaxed">
            I agree to the <Link href="#" className="font-bold text-stone-900 dark:text-white hover:underline">Terms</Link>{' '}
            and <Link href="#" className="font-bold text-stone-900 dark:text-white hover:underline">Privacy Policy</Link>.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors disabled:opacity-50 mt-4"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-stone-500 dark:text-gray-400 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-stone-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
