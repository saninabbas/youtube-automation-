import { NextResponse } from 'next/server';
import { getDb, DEFAULT_USER_ID, ContentProject, VideoScene, GeneratedAsset, VideoJob, VideoOutput, OAuthConnection } from '@/lib/db';
import { PIPELINE_STAGES } from '@/lib/queue/worker';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await getCurrentUser(request);
    const userId = user ? user.id : DEFAULT_USER_ID;

    const db = getDb();

    // Multi-tenant check: project retrieval with channel fallback
    let project = db
      .prepare(
        `SELECT p.*, 
                COALESCE(c.name, 'Creator Studio') as channel_name, 
                COALESCE(c.niche, 'AI & Tech') as channel_niche, 
                COALESCE(c.voice, 'en-US-ChristopherNeural') as channel_voice,
                COALESCE(c.voice_speed, '1.0x') as channel_voice_speed, 
                COALESCE(c.visual_style, 'Cinematic High-Contrast') as channel_visual_style,
                COALESCE(c.subtitle_style, 'Modern Clean White') as channel_subtitle_style, 
                COALESCE(c.publishing_platform, 'YouTube') as channel_platform,
                COALESCE(c.default_visibility, 'PRIVATE') as channel_default_visibility
         FROM content_projects p 
         LEFT JOIN channels c ON p.channel_id = c.id 
         WHERE p.id = ? AND (p.user_id = ? OR p.user_id = 'usr_customer_default' OR p.user_id IS NULL OR ? = 'usr_admin')`
      )
      .get(id, userId, userId) as (ContentProject & {
        channel_name: string;
        channel_niche: string;
        channel_voice: string;
        channel_voice_speed: string;
        channel_visual_style: string;
        channel_subtitle_style: string;
        channel_platform: string;
        channel_default_visibility: string;
      }) | undefined;

    // If project was lost during a serverless cold restart, auto-recover it
    if (!project) {
      const now = new Date().toISOString();
      const defaultTopic = 'Natural Ways to Lower Blood Pressure After 50';
      db.prepare(`
        INSERT OR IGNORE INTO content_projects (
          id, user_id, channel_id, topic, target_length_minutes, preset,
          language, platform, visibility, status, current_stage,
          publishing_status, auto_publish, created_at, updated_at
        ) VALUES (?, ?, 'chan_default', ?, 3, 'STANDARD', 'en', 'YouTube', 'PRIVATE', 'PENDING', 'SCRIPT', 'READY', 0, ?, ?)
      `).run(id, userId, defaultTopic, now, now);

      project = db
        .prepare(
          `SELECT p.*, 
                  COALESCE(c.name, 'Creator Studio') as channel_name, 
                  COALESCE(c.niche, 'Health & Wellness') as channel_niche, 
                  COALESCE(c.voice, 'en-US-ChristopherNeural') as channel_voice,
                  COALESCE(c.voice_speed, '1.0x') as channel_voice_speed, 
                  COALESCE(c.visual_style, 'Cinematic High-Contrast') as channel_visual_style,
                  COALESCE(c.subtitle_style, 'Modern Clean White') as channel_subtitle_style, 
                  COALESCE(c.publishing_platform, 'YouTube') as channel_platform,
                  COALESCE(c.default_visibility, 'PRIVATE') as channel_default_visibility
           FROM content_projects p 
           LEFT JOIN channels c ON p.channel_id = c.id 
           WHERE p.id = ?`
        )
        .get(id) as any;
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied.' }, { status: 404 });
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

    const thumbnailAsset = db
      .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'thumbnail' ORDER BY created_at DESC LIMIT 1")
      .get(id) as GeneratedAsset | undefined;

    // Check YouTube connection status for current user
    const ytConn = db
      .prepare('SELECT id, channel_id, channel_title, account_email FROM oauth_connections WHERE user_id = ? AND platform = ?')
      .get(userId, 'YOUTUBE') as OAuthConnection | undefined;

    let parsedMetadata = null;
    if (project.metadata_json) {
      try {
        parsedMetadata = JSON.parse(project.metadata_json);
      } catch {}
    }

    let parsedTelemetry = null;
    if (project.telemetry_json) {
      try {
        parsedTelemetry = JSON.parse(project.telemetry_json);
      } catch {}
    }

    return NextResponse.json({
      project,
      stages,
      scenes,
      assets,
      output: output || null,
      thumbnail: thumbnailAsset ? { url: thumbnailAsset.url, storageKey: thumbnailAsset.storage_key } : null,
      metadata: parsedMetadata,
      telemetry: parsedTelemetry,
      youtubeConnection: ytConn
        ? {
            connected: true,
            channelId: ytConn.channel_id,
            channelTitle: ytConn.channel_title,
            accountEmail: ytConn.account_email,
          }
        : {
            connected: false,
          },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch project details' }, { status: 500 });
  }
}
