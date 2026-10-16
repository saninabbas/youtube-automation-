import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getUserCredits, grantUserCredits } from '@/lib/db';
import { calculateEntitlements, PLANS, getPaymentProviderStatus } from '@/lib/billing';
import { isPolarConfigured, createPolarCheckout } from '@/lib/polar';
import { apiError } from '@/lib/api-response';
import { IntegrationService } from '@/lib/config/integrationService';

export const dynamic = 'force-dynamic';

function getStripeClient(): Stripe | null {
  const activeConfig = IntegrationService.getActivePaymentConfig();
  const secretKey = activeConfig.stripe?.secretKey || process.env.STRIPE_SECRET_KEY;
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

    const paymentStatus = getPaymentProviderStatus();
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

    const body = await req.json().catch(() => ({}));

    // Handle manual top-up if requested
    if (body.topUpAmount && typeof body.topUpAmount === 'number') {
      const amount = Math.min(Math.max(body.topUpAmount, 50), 2000);
      grantUserCredits(user.id, amount, 'MANUAL_CREDIT', `Added ${amount} credits to your account`);
      return NextResponse.json({
        success: true,
        message: `Added ${amount} credits to your account.`,
      });
    }

    const planId = (body.planId || body.tier || 'creator').toLowerCase();
    const billingCycle: 'monthly' | 'annual' = body.billingCycle === 'annual' || body.isAnnual ? 'annual' : 'monthly';

    const targetPlan = PLANS.find((p) => p.id.toLowerCase() === planId || (planId === 'pro' && p.id === 'creator'));
    if (!targetPlan) {
      return NextResponse.json(
        { success: false, error: `Invalid plan specified: "${planId}". Valid plans: ${PLANS.map(p => p.id).join(', ')}` },
        { status: 400 }
      );
    }

    // Dynamically honor default payment gateway configured in Admin Dashboard
    const activeGateway = IntegrationService.getActivePaymentConfig();
    const preferStripe = activeGateway.provider === 'stripe';

    const tryPolar = async () => {
      if (isPolarConfigured()) {
        const polarResult = await createPolarCheckout({
          userId: user.id,
          userEmail: user.email,
          planId: targetPlan.id,
          billingCycle,
        });

        if (polarResult.success && polarResult.url) {
          return {
            success: true,
            provider: 'polar',
            url: polarResult.url,
            checkoutId: polarResult.checkoutId,
          };
        }
      }
      return null;
    };

    const tryStripe = async () => {
      const stripe = getStripeClient();
      if (stripe) {
        const priceId = getStripePriceId(planId, billingCycle);
        if (!priceId) {
          return {
            error: `Stripe Price ID is not configured for plan "${planId}" (${billingCycle}). Set STRIPE_PRICE_${planId.toUpperCase()}_${billingCycle.toUpperCase()} in environment variables.`,
          };
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autora.live';

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

        return {
          success: true,
          provider: 'stripe',
          url: session.url,
          sessionId: session.id,
        };
      }
      return null;
    };

    if (preferStripe) {
      const stripeRes = await tryStripe();
      if (stripeRes && stripeRes.success) return NextResponse.json(stripeRes);
      const polarRes = await tryPolar();
      if (polarRes && polarRes.success) return NextResponse.json(polarRes);
      if (stripeRes && stripeRes.error) return NextResponse.json({ success: false, error: stripeRes.error }, { status: 400 });
    } else {
      const polarRes = await tryPolar();
      if (polarRes && polarRes.success) return NextResponse.json(polarRes);
      const stripeRes = await tryStripe();
      if (stripeRes && stripeRes.success) return NextResponse.json(stripeRes);
      if (stripeRes && stripeRes.error) return NextResponse.json({ success: false, error: stripeRes.error }, { status: 400 });
    }

    // 3. Neither Gateway Configured
    return NextResponse.json(
      {
        success: false,
        error: 'Payment gateway is being configured. Set POLAR_CHECKOUT_URL or POLAR_ACCESS_TOKEN in .env to enable instant live checkout.',
      },
      { status: 503 }
    );
  } catch (err: any) {
    return apiError(err.message || 'Checkout initialization failed', {
      internalError: err,
      logPrefix: 'POST /api/billing',
    });
  }
}
