/**
 * Billing Architecture & Calculated SaaS Packages
 *
 * Provides normalized pricing, calculated video outputs, credit allotments,
 * and multi-tier monetization packages.
 *
 * ─── CREDIT COST BASIS ───────────────────────────────────────────────────────
 * 1 credit ≈ $0.01 platform cost (with ~3-4× markup for margin)
 *
 * Real API Costs Per Scene Clip (5-8 sec):
 *   FAL.ai Wan 2.1 720p    → ~$0.40/clip
 *   FAL.ai Wan 2.1 1080p   → ~$0.60/clip
 *   Google Veo 3.1 Lite    → ~$0.64/clip (1080p @ $0.08/s × 8s)
 *   Google Veo 3.1 Fast    → ~$0.96/clip (1080p @ $0.12/s × 8s)
 *   Cloudflare SDXL Image  → ~$0.00 (free tier quota)
 *   Motion Still (Ken Burns)→ ~$0.00
 *
 * Real API Costs Per Voice:
 *   ElevenLabs (8-min video) → ~$0.55 (~5,500 chars × $0.10/1k chars)
 *   ElevenLabs (60s short)   → ~$0.07 (~700 chars)
 *   ElevenLabs (15s short)   → ~$0.018 (~175 chars)
 *   Microsoft Edge TTS       → $0.00 (free)
 *
 * ─── COMPETITOR BENCHMARKS ───────────────────────────────────────────────────
 *   InVideo AI  : $20/mo → 400 cr | $60/mo → 2000 cr | $150/mo → 5000 cr
 *   Pictory AI  : $29/mo → 200 video-min | $59/mo → 600 min | $199/mo → 1800 min
 *   Synthesia   : 120 credits/min video | $29/mo → 10 min | $89/mo → 30 min
 *
 * ─── AUTORA CREDIT DESIGN ────────────────────────────────────────────────────
 *   Motion-Still Short (≤60s, 4 scenes)  = 20 credits  (~$0.20 cost, $0.00 AI)
 *   AI-Clip Short (≤60s, 4 scenes FAL)   = 80 credits  (~$0.80 → covers 2 clips)
 *   Motion-Still Long Video (8min, 6 sc) = 50 credits  (~$0.50 cost)
 *   AI-Clip Long Video (8min, 6 sc FAL)  = 250 credits (~$2.50 → covers 4 clips)
 *   ElevenLabs Voice add-on (long)       = 15 credits  (~$0.15)
 *   ElevenLabs Voice add-on (short)      = 5 credits   (~$0.05)
 *   Thumbnail generation                 = 5 credits
 *   Copilot / Script request             = 2 credits
 * ─────────────────────────────────────────────────────────────────────────────
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
  ai_clips_per_video: number;   // how many scenes get real AI video clips
  ai_voice: 'edge' | 'elevenlabs' | 'elevenlabs+clone';
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
    name: 'Starter Plan',
    price_monthly: 19,
    price_annual: 15,
    credits_monthly: 500,
    estimated_videos: 10,       // 10 videos (50 cr each with 1 AI Hero Hook clip + motion stills)
    estimated_shorts: 25,       // 25 shorts (20 cr each with 1 AI Hero Hook clip + motion stills)
    ai_clips_per_video: 1,      // 1 Real AI Video Clip (Opening Hook Scene)
    ai_voice: 'edge',           // Microsoft Edge Neural TTS (free, 50+ voices)
    max_channels: 1,
    max_resolution: '1080p Full HD',
    badge: 'ENTRY CREATOR • 1 AI CLIP/VIDEO',
    is_popular: false,
    cta_label: 'Get Starter Plan ($19/mo)',
    features: [
      '10 Full Videos / Month (1 Daily Video on Starter)',
      '25 YouTube Shorts / Month',
      '1 AI Video Clip per Video (Opening Hook Scene)',
      'Animated Ken Burns Visuals (AI Diffusion Stills)',
      '500 AI Video Credits Every Month',
      '1 Connected YouTube Channel',
      'Microsoft Edge Neural Voices (50+ voices)',
      'AI-Generated Script & Narration (Gemini)',
      'Automated Captions & Subtitles',
      'Zero-Waste Credit Protection',
    ],
  },
  {
    id: 'creator',
    name: 'Creator Plan',
    price_monthly: 49,
    price_annual: 39,
    credits_monthly: 1500,
    estimated_videos: 30,       // 30 videos (50 cr each with 2 AI Hero Clips + motion stills)
    estimated_shorts: 75,       // 75 shorts (20 cr each with 2 AI Hero Clips: Hook + Climax)
    ai_clips_per_video: 2,      // 2 Real AI Video Clips (Hook + Narrative Climax)
    ai_voice: 'elevenlabs',     // ElevenLabs studio voices included
    max_channels: 3,
    max_resolution: '1080p Full HD',
    badge: 'MOST POPULAR • 2 AI CLIPS/VIDEO',
    is_popular: true,
    cta_label: 'Get Creator Plan ($49/mo)',
    features: [
      '30 Full Videos / Month (1 Daily Video)',
      '75 YouTube Shorts / Month',
      '2 AI Video Clips per Video (Hook + Climax Scenes)',
      '1,500 AI Video Credits Every Month',
      '3 Connected YouTube Channels',
      'ElevenLabs Studio Voices (Rachel, Adam, Josh, Bella...)',
      'AI-Generated Visuals (SDXL + Flux + Ken Burns Motion)',
      'Multi-Model Script Engine (Gemini + DeepSeek)',
      'Automated Captions & Subtitle Burn-In',
      'Zero-Waste Policy (Failed jobs never count)',
      'Direct YouTube Auto-Publish & Scheduling',
    ],
  },
  {
    id: 'pro',
    name: 'Pro AI Video Plan',
    price_monthly: 99,
    price_annual: 79,
    credits_monthly: 4000,
    estimated_videos: 16,       // 16 full AI videos (250 cr each, 4 AI video clips)
    estimated_shorts: 50,       // 50 shorts (80 cr each, 100% all scenes AI video clips)
    ai_clips_per_video: 4,      // 4 AI video clips per video (all scenes for Shorts)
    ai_voice: 'elevenlabs',
    max_channels: 10,
    max_resolution: '1080p Full HD',
    badge: '4 AI CLIPS/VIDEO • ALL SHORTS AI',
    is_popular: false,
    cta_label: 'Get Pro Plan ($99/mo)',
    features: [
      '16 Full AI Videos / Month (4 AI Video Clips Each)',
      '50 AI-Powered YouTube Shorts / Month (100% Pure AI Video)',
      '4,000 AI Video Credits Every Month',
      '4 Real AI Video Clips on Every Video',
      'FAL.ai Wan 2.1 & Google Veo 3.1 AI Video Engine',
      '10 Connected YouTube Channels',
      'ElevenLabs Premium Studio Voices',
      'Priority Render Queue & Ultra-Fast Processing',
      'Advanced Content Copilot & Workflow Automation',
      'VIP 24/7 Dedicated Support',
    ],
  },
  {
    id: 'agency',
    name: 'Agency Scale Plan',
    price_monthly: 299,
    price_annual: 239,
    credits_monthly: 15000,
    estimated_videos: 60,       // 60 full AI videos (250 cr each, all scenes AI clips)
    estimated_shorts: 187,      // 187 shorts (80 cr each, all scenes AI clips)
    ai_clips_per_video: 6,      // 6 AI video clips (100% of all scenes)
    ai_voice: 'elevenlabs+clone',
    max_channels: 50,
    max_resolution: '4K Ultra HD',
    badge: 'ENTERPRISE & AGENCIES • 100% AI VIDEO',
    is_popular: false,
    cta_label: 'Get Agency Plan ($299/mo)',
    features: [
      '60 Full AI Videos / Month (All Scenes AI-Generated)',
      '187 AI YouTube Shorts / Month (100% Pure AI Video)',
      '15,000 AI Video Credits Every Month',
      'All Scenes Powered by Real AI Video Generation',
      '50 Connected YouTube Channels',
      'Dedicated Render Nodes — Zero Queue Delay',
      'All AI Video Models (Veo, FAL.ai, Cloudflare MiniMax)',
      'Unlimited Custom Voice Cloning + ElevenLabs',
      'Multi-User Team Workspaces',
      'White-Label Video Rendering',
      'Dedicated Account Manager',
    ],
  },
];

export function getPlanById(id: string): Plan | null {
  const normalizedId = id.toLowerCase();
  if (normalizedId === 'growth') return PLANS.find((p) => p.id === 'creator') || PLANS[1];
  if (normalizedId === 'scale') return PLANS.find((p) => p.id === 'pro') || PLANS[2];
  if (normalizedId === 'enterprise') return PLANS.find((p) => p.id === 'agency') || PLANS[3];
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
    can_generate_video: creditBalance >= 20,
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

// Research-backed pricing (1 credit ≈ $0.01 platform cost, ~3-4× margin)
export const CREDIT_COSTS = {
  // ── Long-form videos (8-min, ~6 scenes) ─────────────────
  MOTION_STILL_VIDEO: 50,      // Ken Burns AI image + motion  (~$0.50 cost)
  AI_CLIP_VIDEO: 250,          // FAL.ai/Veo real AI clips (~$2.50 → ~4 clips @ $0.60)

  // ── YouTube Shorts (≤60s, ~4 scenes) ────────────────────
  MOTION_STILL_SHORT: 20,      // Ken Burns AI image + motion  (~$0.20 cost)
  AI_CLIP_SHORT: 80,           // FAL.ai real AI clips (~$0.80 → ~2 clips @ $0.40)

  // ── Voice add-ons ────────────────────────────────────────
  ELEVENLABS_VOICE_LONG: 15,   // ElevenLabs for long video (~$0.55 cost)
  ELEVENLABS_VOICE_SHORT: 5,   // ElevenLabs for short (~$0.07 cost)

  // ── Other operations ─────────────────────────────────────
  THUMBNAIL_GENERATION: 5,     // AI thumbnail (~$0.05 cost)
  COPILOT_REQUEST: 2,          // Script/copilot AI call (~$0.02 cost)

  // ── Legacy alias (backward compat with existing deduction code) ──
  VIDEO_GENERATION: 50,        // Default = motion-still long video
} as const;

// ============================================================
// DYNAMIC COST CALCULATION & HERO SCENE ALLOCATION
// ============================================================

/**
 * Calculates the exact credit cost for a project based on duration,
 * visual generation mode (AI clip vs motion still), and voice provider.
 */
export function calculateProjectCreditCost(params: {
  targetLengthMinutes: number;
  visualMediaMode?: 'auto' | 'ai_clip' | 'motion_still';
  voice?: string;
  userTier?: string;
}): number {
  const isShort = params.targetLengthMinutes < 2;
  const tier = (params.userTier || 'CREATOR').toLowerCase();
  const plan = getPlanById(tier) || PLANS[1];

  let baseCredits = 0;
  if (params.visualMediaMode === 'ai_clip') {
    // Explicit full AI clip mode requested
    baseCredits = isShort ? CREDIT_COSTS.AI_CLIP_SHORT : CREDIT_COSTS.AI_CLIP_VIDEO;
  } else if (params.visualMediaMode === 'motion_still') {
    // Explicit motion still mode requested
    baseCredits = isShort ? CREDIT_COSTS.MOTION_STILL_SHORT : CREDIT_COSTS.MOTION_STILL_VIDEO;
  } else {
    // 'auto' mode: uses cost-effective hero-scene allocation calibrated to plan tier
    // Starter & Creator: 1-2 hero AI clips + motion stills (20 cr short / 50 cr long)
    // Pro & Agency: high/full AI clip allocation (80 cr short / 250 cr long)
    if (plan.id === 'pro' || plan.id === 'agency') {
      baseCredits = isShort ? CREDIT_COSTS.AI_CLIP_SHORT : CREDIT_COSTS.AI_CLIP_VIDEO;
    } else {
      baseCredits = isShort ? CREDIT_COSTS.MOTION_STILL_SHORT : CREDIT_COSTS.MOTION_STILL_VIDEO;
    }
  }

  // Voice add-on: only charge fee if plan doesn't include ElevenLabs (e.g. Starter tier)
  const voiceStr = (params.voice || '').toLowerCase();
  const requestedElevenLabs = voiceStr.includes('elevenlabs') || voiceStr.startsWith('eleven_');
  const planIncludesElevenLabs = plan.ai_voice.startsWith('elevenlabs');
  if (requestedElevenLabs && !planIncludesElevenLabs) {
    baseCredits += isShort ? CREDIT_COSTS.ELEVENLABS_VOICE_SHORT : CREDIT_COSTS.ELEVENLABS_VOICE_LONG;
  }

  return baseCredits;
}

/**
 * Returns how many scenes are entitled to real AI video clips for a plan.
 */
export function getPlanHeroClipLimit(planId: string): number {
  const plan = getPlanById(planId);
  return plan ? plan.ai_clips_per_video : 1;
}

/**
 * Determines whether a specific scene qualifies as a "Hero Scene" eligible for real
 * AI text-to-video generation (FAL.ai Wan 2.1 / Google Veo) vs cinematic motion-still.
 *
 * Priority Order:
 * 1. Scene 1 (Hook) — Crucial for viewer retention in the first 3-5 seconds
 * 2. Climax / Core Takeaway (Second-to-last scene)
 * 3. Primary Introduction / Core Concept (Scene 2)
 * 4. Mid-point narrative climax
 */
export function isHeroScene(sceneIndex: number, totalScenes: number, maxClips: number): boolean {
  if (maxClips <= 0) return false;
  if (maxClips >= totalScenes) return true;

  const priority: number[] = [1];
  if (totalScenes > 2) {
    priority.push(totalScenes - 1);
  }
  if (totalScenes > 3) {
    priority.push(2);
  }
  if (totalScenes > 4) {
    priority.push(Math.floor(totalScenes / 2));
  }
  for (let i = 1; i <= totalScenes; i++) {
    if (!priority.includes(i)) priority.push(i);
  }

  const heroSet = new Set(priority.slice(0, maxClips));
  return heroSet.has(sceneIndex);
}
