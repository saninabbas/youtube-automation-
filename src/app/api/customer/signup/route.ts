import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { hashPassword, createSession, checkRateLimit, setSessionCookie, sendEmail, buildVerificationEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(`signup_${ip}`, 10, 60000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many signup attempts. Please wait a moment.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { email, password, name = 'Creator' } = body;

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDb();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email address already exists. Please sign in.' }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const { hash, salt } = hashPassword(password);
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); // 24h
    const now = new Date().toISOString();

    // Insert user
    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, salt, name, email_verified,
        verification_token, verification_token_expires, role, status,
        onboarding_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'CUSTOMER', 'ACTIVE', 0, ?, ?)
    `).run(userId, cleanEmail, hash, salt, name.trim(), verificationToken, verificationExpires, now, now);

    // Initialize 500 free credits
    db.prepare(`
      INSERT INTO user_credits (user_id, balance, tier, subscription_status, monthly_allowance, renews_at, updated_at)
      VALUES (?, 500, 'CREATOR', 'ACTIVE', 500, ?, ?)
    `).run(userId, new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), now);

    // Send verification email
    const emailData = buildVerificationEmail(name.trim(), verificationToken);
    await sendEmail({
      to: cleanEmail,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    });

    // Create session
    const userAgent = req.headers.get('user-agent') || undefined;
    const { sessionToken, expiresAt } = createSession(userId, userAgent, ip);

    const user = {
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      email_verified: 0,
      role: 'CUSTOMER',
      onboarding_completed: 0,
    };

    const res = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please verify your email.',
        user,
        verificationToken,
      },
      { status: 201 }
    );

    setSessionCookie(res, sessionToken, expiresAt);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}
