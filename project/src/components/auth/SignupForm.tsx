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
      router.push('/')
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="surface-card p-7 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          New Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Start managing properties and communication in one workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/35 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-clean w-full px-3 py-2.5 text-sm"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-clean w-full px-3 py-2.5 text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="input-clean w-full px-3 py-2.5 text-sm"
            placeholder="At least 6 characters"
          />
          <p className="mt-1 text-xs text-[color:var(--muted)]">Minimum length: 6 characters</p>
        </div>

        <label className="flex items-start gap-2 text-xs text-[color:var(--muted)]">
          <input type="checkbox" required className="mt-0.5" />
          <span>
            I agree to the <Link href="#" className="font-medium text-[color:var(--foreground)]">Terms</Link>{' '}
            and <Link href="#" className="font-medium text-[color:var(--foreground)]">Privacy Policy</Link>.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full px-4 py-2.5 text-sm disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="divider my-6" />
      <p className="text-sm text-[color:var(--muted)]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[color:var(--foreground)]">
          Sign in
        </Link>
      </p>
    </div>
  )
}
