import { NextResponse } from 'next/server';
import { youtubeProvider } from '@/lib/providers/youtubeProvider';
import { DEFAULT_USER_ID } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUrl = youtubeProvider.getAuthUrl(DEFAULT_USER_ID);
    return NextResponse.json({ authUrl, configured: !!authUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate auth URL' }, { status: 500 });
  }
}
