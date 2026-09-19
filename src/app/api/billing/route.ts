import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getUserCredits } from '@/lib/db';
import { calculateEntitlements, PLANS } from '@/lib/billing';
import { apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith('sk_')) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-06-20' as any,
  });
}

function getStripePriceId(planId: string, cycle: 'monthly' | 'annual'): string | null {
  const normPlan = planId.toLowerCase();
  const isAnnual = cycle === 'annual';

  switch (normPlan) {
    case 'starter':
      return isAnnual
        ? process.env.STRIPE_PRICE_STARTER_ANNUAL || null
        : process.env.STRIPE_PRICE_STARTER_MONTHLY || null;
    case 'creator':
    case 'pro':
      return isAnnual
        ? process.env.STRIPE_PRICE_PRO_ANNUAL || null
        : process.env.STRIPE_PRICE_PRO_MONTHLY || null;
    case 'scale':
    case 'growth':
      return isAnnual
        ? process.env.STRIPE_PRICE_GROWTH_ANNUAL || null
        : process.env.STRIPE_PRICE_GROWTH_MONTHLY || null;
    case 'agency':
      return isAnnual
        ? process.env.STRIPE_PRICE_AGENCY_ANNUAL || null
        : process.env.STRIPE_PRICE_AGENCY_MONTHLY || null;
    default:
      return null;
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const credits = getUserCredits(user.id);
    const db = getDb();

    // Fetch transactions scoped strictly to this authenticated user
    const transactions = db
      .prepare('SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
      .all(user.id);

    const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_'));
    const paymentStatus = {
      configured: stripeConfigured,
      provider: stripeConfigured ? ('stripe' as const) : ('none' as const),
      reason: stripeConfigured ? undefined : 'STRIPE_SECRET_KEY is not set or invalid',
    };

    const entitlements = calculateEntitlements(credits.tier.toLowerCase(), credits.balance);

    return NextResponse.json({
      credits,
      transactions,
      plans: PLANS,
      entitlements,
      paymentProvider: paymentStatus,
    });
  } catch (err: any) {
    return apiError('Failed to fetch billing info', { internalError: err, logPrefix: 'GET /api/billing' });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe billing is not configured on this server. Please set STRIPE_SECRET_KEY to enable live checkout.',
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const planId = (body.planId || body.tier || 'creator').toLowerCase();
    const billingCycle: 'monthly' | 'annual' = body.billingCycle === 'annual' ? 'annual' : 'monthly';

    const targetPlan = PLANS.find((p) => p.id.toLowerCase() === planId);
    if (!targetPlan) {
      return NextResponse.json(
        { success: false, error: `Invalid plan specified: "${planId}". Valid plans: starter, creator, scale, agency` },
        { status: 400 }
      );
    }

    const priceId = getStripePriceId(planId, billingCycle);
    if (!priceId) {
      return NextResponse.json(
        {
          success: false,
          error: `Stripe Price ID is not configured for plan "${planId}" (${billingCycle}). Set STRIPE_PRICE_${planId.toUpperCase()}_${billingCycle.toUpperCase()} in environment variables.`,
        },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planId: targetPlan.id,
        billingCycle,
        monthlyCredits: String(targetPlan.credits_monthly),
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: targetPlan.id,
        },
      },
      success_url: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${appUrl}/billing?status=cancelled`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    return apiError(err.message || 'Stripe checkout initialization failed', {
      internalError: err,
      logPrefix: 'POST /api/billing',
    });
  }
}
