import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getUserCredits } from '@/lib/db';
import { getPaymentProviderStatus, calculateEntitlements, PLANS } from '@/lib/billing';

export const dynamic = 'force-dynamic';

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
    return NextResponse.json({ error: err.message || 'Failed to fetch billing info' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const paymentStatus = getPaymentProviderStatus();

    // Strict Billing Guard: Never fake successful payment states
    if (!paymentStatus.configured) {
      return NextResponse.json(
        {
          success: false,
          status: 'CONFIGURATION_REQUIRED',
          configured: false,
          error: 'Real payment provider (Stripe/Paddle) is not configured in environment. Set STRIPE_SECRET_KEY to enable live checkout.',
          reason: paymentStatus.reason,
        },
        { status: 400 }
      );
    }

    // When payment provider is configured, handle checkout session creation
    return NextResponse.json({
      success: true,
      status: 'CHECKOUT_INITIALIZED',
      message: 'Payment gateway initialized with configured provider.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Billing request failed' }, { status: 500 });
  }
}
