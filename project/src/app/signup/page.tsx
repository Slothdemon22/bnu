import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="page-shell min-h-screen">
      <main className="content-wrap py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="surface-card p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              Create Profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Join EstatePro</h1>
            <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-[color:var(--muted)]">
              Set up your account to explore properties, submit meeting requests,
              and collaborate with advisors through one streamlined interface.
            </p>

            <div className="mt-8 grid gap-3 text-sm text-[color:var(--muted)]">
              <p>• Save and revisit shortlisted properties</p>
              <p>• Connect with teams through one communication thread</p>
              <p>• Access video consultations directly from the platform</p>
            </div>

            <Link href="/" className="btn-secondary mt-8 px-4 py-2 text-sm">
              Back to home
            </Link>
          </section>

          <SignupForm />
        </div>
      </main>
    </div>
  )
}
