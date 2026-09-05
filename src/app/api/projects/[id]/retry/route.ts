import { NextResponse } from 'next/server';
import { getDb, DEFAULT_USER_ID, ContentProject, VideoJob } from '@/lib/db';
import { videoWorker, PipelineStage, PIPELINE_STAGES } from '@/lib/queue/worker';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();

    const project = db
      .prepare('SELECT * FROM content_projects WHERE id = ? AND user_id = ?')
      .get(id, user.id) as ContentProject | undefined;

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied.' }, { status: 404 });
    }

    let retryStage: PipelineStage = 'SCRIPT';

    try {
      const body = await request.json();
      if (body && body.stage && PIPELINE_STAGES.includes(body.stage)) {
        retryStage = body.stage;
      } else {
        const failedJob = db
          .prepare("SELECT * FROM video_jobs WHERE project_id = ? AND status = 'FAILED' LIMIT 1")
          .get(id) as VideoJob | undefined;

        if (failedJob && PIPELINE_STAGES.includes(failedJob.stage)) {
          retryStage = failedJob.stage;
        } else if (PIPELINE_STAGES.includes(project.current_stage as PipelineStage)) {
          retryStage = project.current_stage as PipelineStage;
        }
      }
    } catch {
      // Body not provided, use default inference
      const failedJob = db
        .prepare("SELECT * FROM video_jobs WHERE project_id = ? AND status = 'FAILED' LIMIT 1")
        .get(id) as VideoJob | undefined;

      if (failedJob && PIPELINE_STAGES.includes(failedJob.stage)) {
        retryStage = failedJob.stage;
      }
    }

    // Trigger restart from specified stage
    videoWorker.startProjectPipeline(id, retryStage);

    return NextResponse.json({
      message: `Retrying pipeline from stage ${retryStage}`,
      projectId: id,
      restartedFromStage: retryStage,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to retry stage' }, { status: 500 });
  }
}
