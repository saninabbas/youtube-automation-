import { NextResponse } from 'next/server';
import { youtubeProvider } from '@/lib/providers/youtubeProvider';
import { DEFAULT_USER_ID } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state') || DEFAULT_USER_ID;
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/settings/publishing?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings/publishing?error=Missing+authorization+code', request.url));
    }

    const result = await youtubeProvider.handleOAuthCallback(code, state);

    if (!result.success) {
      return NextResponse.redirect(new URL(`/settings/publishing?error=${encodeURIComponent(result.error || 'Authentication failed')}`, request.url));
    }

    return NextResponse.redirect(new URL('/settings/publishing?connected=true', request.url));
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/settings/publishing?error=${encodeURIComponent(err.message || 'OAuth error')}`, request.url));
  }
}
