import { cookies, headers } from 'next/headers';
import crypto from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'autovideo_super_admin_hmac_secret_key_2026';

export function signAdminToken(username: string): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(`${timestamp}:${username}`)
    .digest('hex');
  return `${timestamp}.${username}.${signature}`;
}

export function verifyAdminToken(token: string): boolean {
  if (!token || !token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [timestamp, username, signature] = parts;
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime) || Date.now() - tokenTime > 7 * 24 * 3600 * 1000) {
    return false; // Expired after 7 days
  }

  const expectedSignature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(`${timestamp}:${username}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    return false;
  }
}

export function checkAdminSession(): { authorized: boolean; username: string | null } {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_session_token')?.value;

    if (token && verifyAdminToken(token)) {
      const parts = token.split('.');
      return { authorized: true, username: parts[1] || 'admin' };
    }

    // Also support Authorization header Bearer token for automated CLI / external webhook tests
    const headerStore = headers();
    const authHeader = headerStore.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7).trim();
      if (verifyAdminToken(bearerToken)) {
        const parts = bearerToken.split('.');
        return { authorized: true, username: parts[1] || 'admin' };
      }
    }

    return { authorized: false, username: null };
  } catch {
    return { authorized: false, username: null };
  }
}
