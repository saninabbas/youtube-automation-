/**
 * Billing Architecture & Calculated SaaS Packages
 *
 * Provides normalized pricing, calculated video outputs, credit allotments,
 * and multi-tier monetization packages.
 */

// ============================================================
// INTERFACES
// ============================================================

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  credits_monthly: number;
  estimated_videos: number;
  estimated_shorts: number;
  max_channels: number;
  max_resolution: string;
  badge?: string;
  features: string[];
  is_popular: boolean;
  cta_label: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  provider: PaymentProvider;
  provider_subscription_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export interface Credits {
  customer_id: string;
  balance: number;
  monthly_allowance: number;
  renews_at: string;
}

export interface CreditTransaction {
  id: string;
  customer_id: string;
  amount: number;
  balance_after: number;
  type: TransactionType;
  description: string;
  project_id?: string | null;
  created_at: string;
}

export type TransactionType =
  | 'MONTHLY_GRANT'
  | 'PLAN_UPGRADE'
  | 'VIDEO_GENERATION'
  | 'THUMBNAIL_GENERATION'
  | 'MANUAL_CREDIT'
  | 'REFUND';

export interface Entitlements {
  can_generate_video: boolean;
  can_publish_youtube: boolean;
  can_use_copilot: boolean;
  max_channels: number;
  max_resolution: string;
  monthly_credits: number;
  remaining_credits: number;
  plan_name: string;
}

export type PaymentProvider = 'polar' | 'stripe' | 'paddle' | 'none';

// ============================================================
// CALCULATED PRODUCTION SAAS PACKAGES (2026 EDITION)
// ============================================================

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter Creator',
    price_monthly: 19,
    price_annual: 15,
    credits_monthly: 200,
    estimated_videos: 8,
    estimated_shorts: 20,
    max_channels: 1,
    max_resolution: '1080p Full HD',
    is_popular: false,
    cta_label: 'Get Starter ($19/mo)',
    features: [
      '200 AI Credits / month (~8 Full Videos)',
      '1 YouTube Channel Workspace',
      'Full 1080p MP4 Immediate Downloads',
      'Neural Voiceover Synthesis',
      'Automatic SRT Subtitle Generator',
      'Stock Footage & B-Roll Matcher',
      'Zero-Waste Policy (Failed jobs never count)',
    ],
  },
  {
    id: 'creator',
    name: 'Pro Creator',
    price_monthly: 49,
    price_annual: 39,
    credits_monthly: 600,
    estimated_videos: 24,
    estimated_shorts: 60,
    max_channels: 3,
    max_resolution: '1080p Full HD 60fps',
    badge: 'MOST POPULAR — DAILY CONTENT',
    is_popular: true,
    cta_label: 'Start Pro Creator ($49/mo)',
    features: [
      '600 AI Credits / month (~24 Full Videos)',
      '3 YouTube Channels & Auto-Publish',
      '1080p Full HD 60fps & FastStart MP4',
      'Multi-Model Script Engine (DeepSeek + GPT-4o)',
      'Studio Voices + Custom Voice ID',
      'Multi-Concept High-CTR Thumbnails',
      'Direct YouTube Auto-Publish & Scheduling',
      'Health Content Safe Mode Compliance',
    ],
  },
  {
    id: 'scale',
    name: 'Growth & Scale',
    price_monthly: 99,
    price_annual: 79,
    credits_monthly: 1500,
    estimated_videos: 60,
    estimated_shorts: 150,
    max_channels: 10,
    max_resolution: '4K Ultra-HD',
    badge: 'HIGH VOLUME',
    is_popular: false,
    cta_label: 'Upgrade to Scale ($99/mo)',
    features: [
      '1,500 AI Credits / month (~60 Full Videos)',
      '10 YouTube Channel Workspaces',
      '4K Ultra-HD Video Export',
      'Priority GPU Video Rendering Queue',
      'Dedicated HD B-Roll Sourcing',
      'Multi-User Team Access & Workspaces',
      'Direct API & Webhook Triggers',
      'Custom Content Pacing & Transitions',
    ],
  },
  {
    id: 'agency',
    name: 'Agency Network',
    price_monthly: 199,
    price_annual: 159,
    credits_monthly: 4000,
    estimated_videos: 160,
    estimated_shorts: 400,
    max_channels: 50,
    max_resolution: '4K Master Quality',
    badge: 'ENTERPRISE & AGENCY',
    is_popular: false,
    cta_label: 'Start Agency Network ($199/mo)',
    features: [
      '4,000 AI Credits / month (~160 Full Videos)',
      '50 Channels & Brand Workspaces',
      '4K Master Quality Video Rendering',
      'Custom Voice Cloning Integration',
      'White-Label Studio & Custom Branding',
      'Dedicated Cloud Server Instance',
      '24/7 Priority VIP Creator Support',
      'Custom AI Prompts & Style Fine-Tuning',
    ],
  },
];

export function getPlanById(id: string): Plan | null {
  const normalizedId = id.toLowerCase();
  if (normalizedId === 'pro') return PLANS.find((p) => p.id === 'creator' || p.id === 'scale') || PLANS[1];
  return PLANS.find((p) => p.id.toLowerCase() === normalizedId) || null;
}

// ============================================================
// PAYMENT PROVIDER STATUS & ENTITLEMENTS
// ============================================================

export type BillingConfigStatus =
  | { configured: true; provider: PaymentProvider }
  | { configured: false; reason: string };

import { isPolarConfigured } from './polar';

export function getPaymentProviderStatus(): BillingConfigStatus {
  if (isPolarConfigured()) {
    return { configured: true, provider: 'polar' };
  }
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    return { configured: true, provider: 'stripe' };
  }
  if (process.env.PADDLE_API_KEY) {
    return { configured: true, provider: 'paddle' };
  }
  return {
    configured: false,
    reason: 'Payment provider not configured in environment. Set POLAR_ACCESS_TOKEN or POLAR_CHECKOUT_URL_* in .env for live checkout.',
  };
}

export function calculateEntitlements(
  planId: string,
  creditBalance: number,
): Entitlements {
  const plan = getPlanById(planId) || PLANS[0];

  return {
    can_generate_video: creditBalance >= 25,
    can_publish_youtube: true,
    can_use_copilot: true,
    max_channels: plan.max_channels,
    max_resolution: plan.max_resolution,
    monthly_credits: plan.credits_monthly,
    remaining_credits: creditBalance,
    plan_name: plan.name,
  };
}

// ============================================================
// CREDIT COST CONSTANTS
// ============================================================

export const CREDIT_COSTS = {
  VIDEO_GENERATION: 25,
  THUMBNAIL_GENERATION: 5,
  COPILOT_REQUEST: 1,
} as const;
