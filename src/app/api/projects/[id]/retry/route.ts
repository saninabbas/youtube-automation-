import { NextResponse } from 'next/server';
import { getDb, DEFAULT_USER_ID, ContentProject, VideoJob } from '@/lib/db';
import { videoWorker, PipelineStage, PIPELINE_STAGES } from '@/lib/queue/worker';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();

    const project = db
      .prepare('SELECT * FROM content_projects WHERE id = ?')
      .get(id) as ContentProject | undefined;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let retryStage: PipelineStage = 'SCRIPT';

    try {
      const body = await request.json();
      if (body && body.stage && PIPELINE_STAGES.includes(body.stage)) {
        retryStage = body.stage;
      }
    } catch {
      // Body not provided, default to SCRIPT
    }

    // Execute pipeline synchronously on serverless to guarantee completion
    await videoWorker.processPipeline(id, retryStage);

    return NextResponse.json({
      success: true,
      message: `Video generated successfully from stage ${retryStage}`,
      projectId: id,
      restartedFromStage: retryStage,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to retry stage' }, { status: 500 });
  }
}
