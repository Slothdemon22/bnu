'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

import { auth } from '@/lib/firebase/client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      if (data.user && data.user.onboardingCompleted === false) {
        window.location.href = '/onboarding'
      } else {
        window.location.href = '/'
      }
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })

      const firebaseSession = await signInWithPopup(auth, provider)
      const idToken = await firebaseSession.user.getIdToken()

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || 'Google sign-in failed')
        setGoogleLoading(false)
        return
      }

      // App auth is cookie-based; clear Firebase client session.
      await signOut(auth).catch(() => {})

      if (data.user && (data.user.isNewUser || data.user.onboardingCompleted === false)) {
        window.location.href = '/onboarding'
      } else {
        window.location.href = '/'
      }
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.')
      } else {
        setError('Google sign-in failed. Please try again.')
      }
      setGoogleLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-stone-200/50 dark:shadow-black/50">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Account Access
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tighter text-stone-900 dark:text-white">Sign in</h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-gray-400 font-medium">
          Access your workspace, tasks, and team settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-500/30 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-stone-900 dark:text-white font-bold hover:bg-stone-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {googleLoading ? (
            'Connecting...'
          ) : (
            <>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 11.4S6.9 20.6 12 20.6c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.8-.1-1.1H12z" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-stone-200 dark:bg-gray-800"></div>
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Or</span>
          <div className="flex-1 h-px bg-stone-200 dark:bg-gray-800"></div>
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
            disabled={loading || googleLoading}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="text-sm font-bold text-stone-900 dark:text-white">
              Password
            </label>
            <Link href="#" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || googleLoading}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-stone-500 dark:text-gray-400 font-medium">
          New here?{' '}
          <Link href="/signup" className="font-bold text-stone-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
