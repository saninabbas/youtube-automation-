import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, DEFAULT_USER_ID, ContentProject, Channel, deductUserCredits } from '@/lib/db';
import { videoWorker } from '@/lib/queue/worker';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();
    const projects = db
      .prepare(
        `SELECT p.*, c.name as channel_name, c.niche as channel_niche 
         FROM content_projects p 
         JOIN channels c ON p.channel_id = c.id 
         WHERE p.user_id = ? 
         ORDER BY p.created_at DESC`
      )
      .all(user.id) as ContentProject[];

    return NextResponse.json({ projects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      channel_id,
      topic,
      preset = 'STANDARD',
      target_length_minutes = 5,
      language = 'en',
      platform = 'YouTube',
      visibility = 'PRIVATE',
      scheduled_at = null,
      auto_publish = 0,
    } = body;

    if (!channel_id) {
      return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }
    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const db = getDb();

    // Verify channel belongs strictly to this authenticated user
    const channel = db
      .prepare('SELECT * FROM channels WHERE id = ? AND user_id = ?')
      .get(channel_id, user.id) as Channel | undefined;

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found or not owned by user' }, { status: 404 });
    }

    const projectId = uuidv4();
    const now = new Date().toISOString();
    const willAutoPublish = auto_publish || channel.auto_publish ? 1 : 0;
    const initialPublishStatus = scheduled_at ? 'SCHEDULED' : willAutoPublish ? 'SCHEDULED' : 'DRAFT';

    // Deduct 25 credits for automated generation
    deductUserCredits(user.id, 25, 'GENERATE_VIDEO', `Generated video: ${topic.trim().substring(0, 40)}`, projectId);

    db.prepare(
      `INSERT INTO content_projects (
        id, user_id, channel_id, topic, target_length_minutes, preset,
        language, platform, visibility, status, current_stage, publishing_status,
        scheduled_at, auto_publish, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      projectId,
      user.id,
      channel_id,
      topic.trim(),
      Number(target_length_minutes) || 5,
      preset,
      language || channel.language,
      platform || channel.publishing_platform,
      visibility || channel.default_visibility || 'PRIVATE',
      'PENDING',
      'SCRIPT',
      initialPublishStatus,
      scheduled_at,
      willAutoPublish,
      now,
      now
    );

    // Trigger pipeline worker
    videoWorker.startProjectPipeline(projectId);

    return NextResponse.json(
      {
        message: 'Video project created and generation queued',
        projectId,
        status: 'PENDING',
        publishingStatus: initialPublishStatus,
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create project' }, { status: 500 });
  }
}
