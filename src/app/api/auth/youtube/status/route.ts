import { NextResponse } from 'next/server';
import { youtubeProvider } from '@/lib/providers/youtubeProvider';
import { DEFAULT_USER_ID } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await youtubeProvider.getConnectionStatus(DEFAULT_USER_ID);
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to get connection status' }, { status: 500 });
  }
}
