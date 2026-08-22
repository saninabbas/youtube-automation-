import { NextResponse } from 'next/server';
import { getDb, DEFAULT_USER_ID, ContentProject, Channel, VideoOutput, GeneratedAsset } from '@/lib/db';
import { publishingProvider, SupportedPlatform } from '@/lib/providers/publishingProvider';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { visibility = 'PRIVATE', scheduleTime = null, platform = 'YouTube' } = body;

    const db = getDb();
    const project = db
      .prepare(
        `SELECT p.*, c.name as channel_name, c.publishing_platform as channel_platform 
         FROM content_projects p 
         JOIN channels c ON p.channel_id = c.id 
         WHERE p.id = ? AND p.user_id = ?`
      )
      .get(id, DEFAULT_USER_ID) as (ContentProject & { channel_name: string; channel_platform: string }) | undefined;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Video generation is not complete yet.' }, { status: 400 });
    }

    const output = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(id) as VideoOutput | undefined;
    if (!output) {
      return NextResponse.json({ error: 'No final video output file available to publish.' }, { status: 400 });
    }

    const thumbnail = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'thumbnail' ORDER BY created_at DESC LIMIT 1").get(id) as GeneratedAsset | undefined;
    const videoFilePath = storage.getFilePath(output.storage_key);
    const thumbnailFilePath = thumbnail ? storage.getFilePath(thumbnail.storage_key) : undefined;

    let parsedMeta = { youtubeTitle: project.topic, description: project.topic, tags: [] as string[] };
    if (project.metadata_json) {
      try {
        parsedMeta = JSON.parse(project.metadata_json);
      } catch {}
    }

    // If scheduling for a future time
    if (scheduleTime && new Date(scheduleTime).getTime() > Date.now()) {
      const scheduledIso = new Date(scheduleTime).toISOString();
      db.prepare(
        `UPDATE content_projects SET 
          publishing_status = 'SCHEDULED', 
          scheduled_at = ?, 
          visibility = ?, 
          platform = ?, 
          updated_at = ? 
         WHERE id = ?`
      ).run(scheduledIso, visibility, platform, new Date().toISOString(), id);

      return NextResponse.json({
        message: `Video scheduled for ${scheduledIso}`,
        publishingStatus: 'SCHEDULED',
        scheduledAt: scheduledIso,
      });
    }

    // Direct Instant Publishing
    const publishStartTime = new Date().toISOString();
    db.prepare(
      `UPDATE content_projects SET 
        publishing_status = 'UPLOADING', 
        publish_started_at = ?, 
        visibility = ?, 
        publish_error = NULL, 
        updated_at = ? 
       WHERE id = ?`
    ).run(publishStartTime, visibility, publishStartTime, id);

    const pubResult = await publishingProvider.publishVideo({
      projectId: project.id,
      platform: (platform as SupportedPlatform) || 'YouTube',
      videoFilePath,
      title: parsedMeta.youtubeTitle || project.topic,
      description: parsedMeta.description || project.topic,
      tags: parsedMeta.tags || [],
      thumbnailFilePath,
      visibility: visibility as any,
      userId: DEFAULT_USER_ID,
    });

    const publishEndTime = new Date().toISOString();

    if (pubResult.status === 'PUBLISHED' || pubResult.status === 'SCHEDULED') {
      db.prepare(
        `UPDATE content_projects SET 
          publishing_status = 'PUBLISHED', 
          published_at = ?, 
          publish_completed_at = ?, 
          publish_provider = ?, 
          publish_video_id = ?, 
          publish_url = ?, 
          publish_error = NULL, 
          updated_at = ? 
         WHERE id = ?`
      ).run(
        publishEndTime,
        publishEndTime,
        pubResult.platform,
        pubResult.platformVideoId || null,
        pubResult.platformUrl || null,
        publishEndTime,
        id
      );

      return NextResponse.json({
        message: 'Video published successfully',
        publishingStatus: 'PUBLISHED',
        videoId: pubResult.platformVideoId,
        videoUrl: pubResult.platformUrl,
      });
    } else {
      db.prepare(
        `UPDATE content_projects SET 
          publishing_status = ?, 
          publish_error = ?, 
          updated_at = ? 
         WHERE id = ?`
      ).run(
        pubResult.status === 'NOT_CONNECTED' ? 'NOT_CONNECTED' : 'FAILED',
        pubResult.errorMessage || 'Publishing failed',
        publishEndTime,
        id
      );

      return NextResponse.json(
        {
          error: pubResult.errorMessage || 'Publishing failed',
          publishingStatus: pubResult.status,
        },
        { status: pubResult.status === 'NOT_CONNECTED' ? 400 : 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Publishing request failed' }, { status: 500 });
  }
}
