import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // In a real app, you'd verify the specific session ID from the query param
    // But for this dev environment, we'll check if the user has any active subscriptions
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No stripe customer found' }, { status: 404 })
    }

    const customerId = customers.data[0].id
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active'
    })

    if (subscriptions.data.length > 0) {
      // User has an active subscription, update DB
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isPremium: true,
          stripeCustomerId: customerId
        }
      })
      return NextResponse.json({ success: true, isPremium: true })
    }

    return NextResponse.json({ success: true, isPremium: false })
  } catch (error: any) {
    console.error('Verify session error:', error)
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 })
  }
}
