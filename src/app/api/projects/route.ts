import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, DEFAULT_USER_ID, ContentProject, Channel, deductUserCredits } from '@/lib/db';
import { videoWorker } from '@/lib/queue/worker';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const userId = user?.id || DEFAULT_USER_ID;

    const db = getDb();
    let projects = db
      .prepare(
        `SELECT p.*, COALESCE(c.name, 'Creator Studio') as channel_name, COALESCE(c.niche, 'AI & Tech') as channel_niche 
         FROM content_projects p 
         LEFT JOIN channels c ON p.channel_id = c.id 
         WHERE p.user_id = ? 
         ORDER BY p.created_at DESC`
      )
      .all(userId) as ContentProject[];

    if (projects.length === 0) {
      const now = new Date().toISOString();
      let userChannel = db.prepare('SELECT id FROM channels WHERE user_id = ? LIMIT 1').get(userId) as { id: string } | undefined;
      const channelId = userChannel ? userChannel.id : `chan_${userId.substring(4)}`;
      
      // Seed default channel so channel relations are always intact
      db.prepare(`
        INSERT OR IGNORE INTO channels (
          id, user_id, name, niche, language, voice, voice_speed,
          target_duration_minutes, visual_style, subtitle_style, intro_style, outro_cta,
          publishing_platform, content_rules, publishing_days, publishing_time, timezone,
          default_visibility, auto_publish, created_at, updated_at
        ) VALUES (?, ?, 'Creator Studio', 'AI & Tech', 'en', 'en-US-ChristopherNeural', '1.0x', 3, 'Cinematic High-Contrast', 'Modern Clean White', 'High-Impact Hook', 'Subscribe for more breakdowns', 'YouTube', 'Professional studio pacing', '["Monday","Wednesday","Friday"]', '14:00', 'UTC', 'PRIVATE', 0, ?, ?)
      `).run(channelId, userId, now, now);

      return NextResponse.json({ projects: [] });
    }

    return NextResponse.json({ projects });
  } catch (err: any) {
    console.error('Projects GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const userId = user?.id || DEFAULT_USER_ID;

    const body = await request.json();
    let {
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

    const db = getDb();
    const now = new Date().toISOString();

    // Auto-resolve channel_id if missing
    if (!channel_id) {
      const existing = db.prepare('SELECT id FROM channels WHERE user_id = ? LIMIT 1').get(userId) as { id: string } | undefined;
      channel_id = existing ? existing.id : `chan_${userId.substring(4)}`;
    }
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json({ error: 'Topic is required and cannot be empty' }, { status: 400 });
    }
    const cleanTopic = topic.trim().substring(0, 500);

    // Ensure user record exists
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, salt, name, email_verified, role, status, onboarding_completed, created_at, updated_at)
      VALUES (?, ?, '', '', ?, 1, 'CUSTOMER', 'ACTIVE', 1, ?, ?)
    `).run(userId, user?.email || 'creator@autovideo.local', user?.name || 'Creator', now, now);

    // Verify or auto-provision channel in container DB
    let channel = db
      .prepare('SELECT * FROM channels WHERE id = ?')
      .get(channel_id) as Channel | undefined;

    if (!channel) {
      db.prepare(`
        INSERT OR IGNORE INTO channels (
          id, user_id, name, niche, language, voice, voice_speed,
          target_duration_minutes, visual_style, subtitle_style, intro_style, outro_cta,
          publishing_platform, content_rules, publishing_days, publishing_time, timezone,
          default_visibility, auto_publish, created_at, updated_at
        ) VALUES (?, ?, 'Creator Channel', 'AI & Technology', 'en', 'en-US-ChristopherNeural', '1.0x', 5, 'Cinematic High-Contrast', 'Modern Clean White', 'High-Impact Dramatic Question', 'Subscribe to the channel and leave your thoughts below', 'YouTube', 'Engaging, clear, professional tone', '["Monday","Wednesday","Friday"]', '14:00', 'UTC', 'PRIVATE', 0, ?, ?)
      `).run(channel_id, userId, now, now);
      channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channel_id) as Channel | undefined;
    }

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const projectId = uuidv4();
    const willAutoPublish = auto_publish || channel.auto_publish ? 1 : 0;
    const initialPublishStatus = scheduled_at ? 'SCHEDULED' : willAutoPublish ? 'SCHEDULED' : 'DRAFT';

    // Deduct 25 credits for automated generation
    try {
      deductUserCredits(userId, 25, 'GENERATE_VIDEO', `Generated video: ${topic.trim().substring(0, 40)}`, projectId);
    } catch {}

    db.prepare(
      `INSERT INTO content_projects (
        id, user_id, channel_id, topic, target_length_minutes, preset,
        language, platform, visibility, status, current_stage, publishing_status,
        scheduled_at, auto_publish, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      projectId,
      userId,
      channel_id,
      cleanTopic,
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

    // Launch pipeline in background (client Studio monitors and can trigger generation)
    videoWorker.startProjectPipeline(projectId);

    return NextResponse.json(
      {
        message: 'Video project created successfully',
        projectId,
        status: 'DRAFT',
        publishingStatus: initialPublishStatus,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create project' }, { status: 500 });
  }
}
