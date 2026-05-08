import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="page-shell min-h-screen">
      <main className="content-wrap py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="surface-card p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              Welcome Back
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">EstatePro</h1>
            <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-[color:var(--muted)]">
              Sign in to continue managing listings, reviewing meeting requests,
              and keeping client conversations organized.
            </p>

            <div className="mt-8 space-y-3 text-sm text-[color:var(--muted)]">
              <p>• Premium property discovery and curation</p>
              <p>• Built-in community and direct messaging</p>
              <p>• Meeting workflow with admin approvals</p>
            </div>

            <Link href="/" className="btn-secondary mt-8 px-4 py-2 text-sm">
              Back to home
            </Link>
          </section>

          <LoginForm />
        </div>
      </main>
    </div>
  )
}
