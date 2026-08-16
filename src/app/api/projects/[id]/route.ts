import { NextResponse } from 'next/server';
import { getDb, DEFAULT_USER_ID, ContentProject, Channel, VideoScene, GeneratedAsset, VideoJob, VideoOutput } from '@/lib/db';
import { PIPELINE_STAGES } from '@/lib/queue/worker';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const db = getDb();

    const project = db
      .prepare(
        `SELECT p.*, c.name as channel_name, c.niche as channel_niche, c.voice as channel_voice 
         FROM content_projects p 
         JOIN channels c ON p.channel_id = c.id 
         WHERE p.id = ? AND p.user_id = ?`
      )
      .get(id, DEFAULT_USER_ID) as (ContentProject & { channel_name: string; channel_niche: string; channel_voice: string }) | undefined;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const rawJobs = db
      .prepare('SELECT * FROM video_jobs WHERE project_id = ?')
      .all(id) as VideoJob[];

    const jobsMap = new Map<string, VideoJob>();
    for (const job of rawJobs) {
      jobsMap.set(job.stage, job);
    }

    const stages = PIPELINE_STAGES.map((stageName) => {
      const existing = jobsMap.get(stageName);
      return {
        stage: stageName,
        status: existing ? existing.status : 'PENDING',
        error_message: existing ? existing.error_message : null,
        started_at: existing ? existing.started_at : null,
        completed_at: existing ? existing.completed_at : null,
      };
    });

    const scenes = db
      .prepare('SELECT * FROM video_scenes WHERE project_id = ? ORDER BY scene_index ASC')
      .all(id) as VideoScene[];

    const assets = db
      .prepare('SELECT * FROM generated_assets WHERE project_id = ? ORDER BY created_at ASC')
      .all(id) as GeneratedAsset[];

    const output = db
      .prepare('SELECT * FROM video_outputs WHERE project_id = ?')
      .get(id) as VideoOutput | undefined;

    return NextResponse.json({
      project,
      stages,
      scenes,
      assets,
      output: output || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch project details' }, { status: 500 });
  }
}
