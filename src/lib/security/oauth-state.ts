import crypto from 'crypto';
import { getDb } from '@/lib/db';

const STATE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes expiration window

function getStateSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('Missing AUTH_SECRET or ADMIN_SECRET in environment.');
  }
  return secret;
}

// Fallback in-memory tracking if DB is temporarily unreachable
const memoryNonces = new Set<string>();

/**
 * Generates an unpredictable, cryptographically signed, single-use, time-limited OAuth state token.
 */
export function generateOAuthState(userId: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const data = `${userId}:${timestamp}:${nonce}`;
  const signature = crypto.createHmac('sha256', getStateSecret()).update(data).digest('hex');
  
  const payload = JSON.stringify({ userId, timestamp, nonce, signature });
  return Buffer.from(payload).toString('base64url');
}

/**
 * Validates the authenticity, freshness, session ownership, and single-use status of an OAuth state token.
 */
export function verifyOAuthState(
  state: string | null | undefined,
  expectedUserId?: string
): { valid: boolean; userId?: string; error?: string } {
  if (!state || typeof state !== 'string') {
    return { valid: false, error: 'Missing OAuth state' };
  }

  const secret = process.env.AUTH_SECRET || process.env.ADMIN_SECRET;
  if (!secret) {
    return { valid: false, error: 'OAuth state secret is not configured on this server.' };
  }

  try {
    let jsonStr: string;
    try {
      jsonStr = Buffer.from(state, 'base64url').toString('utf8');
    } catch {
      return { valid: false, error: 'Invalid base64 encoding in state' };
    }

    const parsed = JSON.parse(jsonStr);
    const { userId, timestamp, nonce, signature } = parsed;

    if (!userId || !timestamp || !nonce || !signature) {
      return { valid: false, error: 'Malformed OAuth state structure' };
    }

    // 1. Verify expiration (15 minutes)
    if (Date.now() - timestamp > STATE_MAX_AGE_MS || timestamp > Date.now() + 60000) {
      return { valid: false, error: 'OAuth state has expired. Please initiate connection again.' };
    }

    // 2. Verify cryptographic signature
    const data = `${userId}:${timestamp}:${nonce}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false, error: 'Tampered OAuth state signature' };
    }

    // 3. Single-use check (replay protection with DB persistence)
    try {
      const db = getDb();
      db.prepare(`
        CREATE TABLE IF NOT EXISTS oauth_nonces (
          nonce TEXT PRIMARY KEY,
          created_at INTEGER NOT NULL
        )
      `).run();

      const expirationThreshold = Date.now() - STATE_MAX_AGE_MS;
      db.prepare('DELETE FROM oauth_nonces WHERE created_at < ?').run(expirationThreshold);

      db.prepare('INSERT INTO oauth_nonces (nonce, created_at) VALUES (?, ?)').run(nonce, Date.now());
    } catch (dbErr: any) {
      if (
        dbErr.message?.includes('UNIQUE') ||
        dbErr.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
        dbErr.message?.includes('PRIMARY KEY')
      ) {
        return { valid: false, error: 'OAuth state has already been consumed (replay attempt detected)' };
      }
      // Memory fallback if DB is undergoing maintenance
      if (memoryNonces.has(nonce)) {
        return { valid: false, error: 'OAuth state has already been consumed (replay attempt detected)' };
      }
      memoryNonces.add(nonce);
    }

    // 4. Session matching check
    if (expectedUserId && expectedUserId !== userId) {
      return { valid: false, error: 'OAuth state does not match the active session user' };
    }

    return { valid: true, userId };
  } catch (err: any) {
    return { valid: false, error: 'Invalid or unparseable OAuth state' };
  }
}

