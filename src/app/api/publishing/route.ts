import { NextResponse } from 'next/server';
import { publishingProvider, SupportedPlatform } from '@/lib/providers/publishingProvider';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const platforms: SupportedPlatform[] = ['YouTube', 'TikTok', 'Instagram', 'Facebook'];
  const statusList = platforms.map((platform) => ({
    platform,
    ...publishingProvider.getPlatformStatus(platform),
  }));

  return NextResponse.json({ platforms: statusList });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: authentication required to publish videos' }, { status: 401 });
    }

    const body = await request.json();
    const { platform = 'YouTube', projectId, videoFilePath, title, description, tags } = body;

    const result = await publishingProvider.publishVideo({
      projectId,
      platform,
      videoFilePath: videoFilePath || '',
      title: title || '',
      description: description || '',
      tags,
    });

    return NextResponse.json({ result }, { status: 501 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Publishing request failed' }, { status: 500 });
  }
}
