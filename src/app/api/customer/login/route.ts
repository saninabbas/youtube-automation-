import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createSession, checkRateLimit, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(`login_${ip}`, 10, 60000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please wait 1 minute.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDb();

    const user = db
      .prepare('SELECT id, email, password_hash, salt, name, avatar, email_verified, role, status, onboarding_completed FROM users WHERE email = ?')
      .get(cleanEmail) as any;

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This account has been disabled. Please contact support.' }, { status: 403 });
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (user.email_verified === 0) {
      return NextResponse.json({ error: 'Email not verified. Please check your inbox.', unverified: true }, { status: 403 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const { sessionToken, expiresAt } = createSession(user.id, userAgent, ip);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      email_verified: user.email_verified,
      role: user.role,
      onboarding_completed: user.onboarding_completed,
    };

    const res = NextResponse.json({
      success: true,
      message: 'Signed in successfully.',
      user: safeUser,
    });

    setSessionCookie(res, sessionToken, expiresAt);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
