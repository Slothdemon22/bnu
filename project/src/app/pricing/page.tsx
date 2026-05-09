'use client'

import React from 'react'
import { Check, Zap, Crown, Rocket, Star, Shield, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function PricingPage() {
  const { user } = useAuth()

  const handleSubscribe = async (plan: string, price: number) => {
    if (!user) {
      toast.error('Please login to subscribe')
      return
    }

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: price,
          productName: `FlowSync ${plan} Plan`,
          planType: plan.toLowerCase()
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to start checkout')
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const plans = [
    {
      name: 'Free',
      price: 0,
      description: 'Perfect for individuals and small side projects.',
      features: [
        'Up to 3 Workspaces',
        'Unlimited Tasks',
        'Basic AI Task Parsing',
        'Community Chat Access',
        'Standard Task Views'
      ],
      buttonText: 'Current Plan',
      isCurrent: !user?.isPremium,
      highlight: false
    },
    {
      name: 'Pro',
      price: 29,
      description: 'Advanced features for teams and power users.',
      features: [
        'Unlimited Workspaces',
        'Priority AI Task Parsing',
        'Advanced Analytics',
        'Custom Roles & Permissions',
        'Premium Support',
        'Exclusive Pro Badge'
      ],
      buttonText: 'Upgrade to Pro',
      isCurrent: user?.isPremium,
      highlight: true
    }
  ]

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
            <Zap className="w-3 h-3" /> Subscription Plans
          </div>
          <h1 className="text-6xl font-black text-stone-900 dark:text-white tracking-tighter">
            Fuel your productivity.
          </h1>
          <p className="text-stone-500 dark:text-gray-400 max-w-xl mx-auto font-medium">
            Choose the plan that fits your scale. Upgrade any time to unlock unlimited workspaces and advanced AI features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative p-10 rounded-[3rem] transition-all duration-500 ${
                plan.highlight 
                  ? 'bg-stone-900 text-white shadow-2xl shadow-stone-900/20 scale-105' 
                  : 'bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 text-stone-900 dark:text-white'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-bounce">
                  <Star className="w-3 h-3 fill-current" /> Most Popular
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tighter mb-2">{plan.name}</h2>
                <p className={`text-sm font-medium ${plan.highlight ? 'text-stone-400' : 'text-stone-500'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black tracking-tighter">${plan.price}</span>
                <span className={`text-sm font-bold uppercase tracking-widest ${plan.highlight ? 'text-stone-500' : 'text-stone-400'}`}>
                  / month
                </span>
              </div>

              <div className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      plan.highlight ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    }`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-bold ${plan.highlight ? 'text-stone-300' : 'text-stone-600 dark:text-gray-400'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                disabled={plan.isCurrent}
                onClick={() => handleSubscribe(plan.name, plan.price)}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                  plan.isCurrent
                    ? 'bg-stone-100 dark:bg-gray-800 text-stone-400 cursor-not-allowed'
                    : plan.highlight
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-600/20'
                      : 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:scale-[1.02] active:scale-95 shadow-xl'
                }`}
              >
                {plan.buttonText}
                {!plan.isCurrent && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20 p-10 bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner shrink-0">
            <Shield className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight mb-1">Enterprise Grade Security</h3>
            <p className="text-sm text-stone-500 dark:text-gray-400 font-medium">
              We use Stripe for all payment processing. Your credit card information is never stored on our servers. Secure, encrypted, and trusted worldwide.
            </p>
          </div>
          <Link 
            href="/"
            className="px-8 py-4 text-xs font-black text-stone-400 uppercase tracking-widest hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    </div>
  )
}
