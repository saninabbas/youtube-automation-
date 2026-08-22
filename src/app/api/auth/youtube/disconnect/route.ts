import { NextResponse } from 'next/server';
import { youtubeProvider } from '@/lib/providers/youtubeProvider';
import { DEFAULT_USER_ID } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await youtubeProvider.disconnect(DEFAULT_USER_ID);
    return NextResponse.json({ success: true, message: 'YouTube account disconnected.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to disconnect' }, { status: 500 });
  }
}
