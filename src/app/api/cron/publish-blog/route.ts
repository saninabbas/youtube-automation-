import { NextRequest, NextResponse } from 'next/server';
import { publishDailyBlog } from '@/lib/blog/publisher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max execution time for LLM generation

export async function GET(req: NextRequest) {
  return handlePublishRequest(req);
}

export async function POST(req: NextRequest) {
  return handlePublishRequest(req);
}

async function handlePublishRequest(req: NextRequest) {
  // 1. Authenticate Request
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const searchParams = req.nextUrl.searchParams;
  const querySecret = searchParams.get('key') || searchParams.get('secret');

  const providedSecret = bearerToken || querySecret;
  const validSecret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;

  if (!validSecret || providedSecret !== validSecret) {
    return NextResponse.json(
      { error: 'Unauthorized: valid CRON_SECRET or ADMIN_SECRET required.' },
      { status: 401 }
    );
  }

  // 2. Parse Options
  const dryRun = searchParams.get('dryRun') === 'true';
  const force = searchParams.get('force') === 'true';
  const dayIndexParam = searchParams.get('dayIndex');
  const dayIndex = dayIndexParam ? parseInt(dayIndexParam, 10) : undefined;

  try {
    const result = await publishDailyBlog({
      dryRun,
      force,
      dayIndex,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    console.error('[API /api/cron/publish-blog] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error during blog publication.',
      },
      { status: 500 }
    );
  }
}
