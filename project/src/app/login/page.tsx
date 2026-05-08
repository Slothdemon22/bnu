import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { Hexagon, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-gray-950">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex flex-1 relative bg-stone-900 text-white overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-lg">
          <Link href="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity w-fit">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter">Ionio</span>
          </Link>
          
          <h1 className="text-5xl font-black tracking-tighter leading-[1.1] mb-6">
            The intelligent workspace for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">modern teams.</span>
          </h1>
          
          <p className="text-lg text-stone-400 font-medium mb-12 max-w-md leading-relaxed">
            Sign in to continue managing tasks, running meetings, and keeping your organization perfectly synchronized.
          </p>

          <div className="space-y-4">
            {[
              'AI-powered task management',
              'Built-in video meetings & chat',
              'Streamlined team collaboration'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-stone-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative">
        <Link href="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <Hexagon className="w-6 h-6 text-emerald-500" />
          <span className="text-lg font-black tracking-tighter text-stone-900 dark:text-white">Ionio</span>
        </Link>
        <div className="w-full max-w-[420px] relative z-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
