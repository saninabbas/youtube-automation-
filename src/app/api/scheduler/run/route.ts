import { NextResponse } from 'next/server';
import { publishingScheduler } from '@/lib/scheduler';
import { DEFAULT_USER_ID } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await publishingScheduler.checkAndPublishDueVideos(DEFAULT_USER_ID);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scheduler run failed' }, { status: 500 });
  }
}
