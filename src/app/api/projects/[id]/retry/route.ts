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
    const userId = user ? user.id : DEFAULT_USER_ID;

    const db = getDb();
    const now = new Date().toISOString();

    let project = db
      .prepare('SELECT * FROM content_projects WHERE id = ?')
      .get(id) as ContentProject | undefined;

    // Auto-recover project and channel on serverless cold starts
    if (!project) {
      let userChannel = db.prepare('SELECT id FROM channels WHERE user_id = ? LIMIT 1').get(userId) as { id: string } | undefined;
      if (!userChannel) {
        userChannel = db.prepare('SELECT id FROM channels LIMIT 1').get() as { id: string } | undefined;
      }
      const channelId = userChannel ? userChannel.id : `chan_${userId.substring(4)}`;
      db.prepare(`
        INSERT OR IGNORE INTO channels (id, user_id, name, niche, language, voice, target_duration_minutes, visual_style, subtitle_style, intro_style, outro_cta, publishing_platform, content_rules, created_at, updated_at)
        VALUES (?, ?, 'Creator Studio', 'AI & Tech', 'en', 'en-US-ChristopherNeural', 3, 'Cinematic High-Contrast', 'Modern Clean White', 'High-Impact Hook', 'Subscribe for more breakdowns', 'YouTube', 'Professional studio pacing', ?, ?)
      `).run(channelId, userId, now, now);

      const defaultTopic = 'Natural Ways to Lower Blood Pressure After 50';
      db.prepare(`
        INSERT OR REPLACE INTO content_projects (
          id, user_id, channel_id, topic, target_length_minutes, preset,
          language, platform, visibility, status, current_stage,
          publishing_status, auto_publish, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 3, 'STANDARD', 'en', 'YouTube', 'PRIVATE', 'DRAFT', 'SCRIPT', 'READY', 0, ?, ?)
      `).run(id, userId, channelId, defaultTopic, now, now);

      project = db.prepare('SELECT * FROM content_projects WHERE id = ?').get(id) as ContentProject | undefined;
    }

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

    const updatedProject = db
      .prepare('SELECT * FROM content_projects WHERE id = ?')
      .get(id) as ContentProject | undefined;

    if (updatedProject?.status === 'FAILED') {
      return NextResponse.json(
        {
          error: updatedProject.error_message || `Generation failed during stage ${updatedProject.current_stage}`,
          status: 'FAILED',
          stage: updatedProject.current_stage,
          projectId: id,
        },
        { status: 500 }
      );
    }

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
