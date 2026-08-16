import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, DEFAULT_USER_ID, ContentProject, Channel } from '@/lib/db';
import { videoWorker } from '@/lib/queue/worker';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const projects = db
      .prepare(
        `SELECT p.*, c.name as channel_name, c.niche as channel_niche 
         FROM content_projects p 
         JOIN channels c ON p.channel_id = c.id 
         WHERE p.user_id = ? 
         ORDER BY p.created_at DESC`
      )
      .all(DEFAULT_USER_ID) as ContentProject[];

    return NextResponse.json({ projects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel_id, topic, target_length_minutes = 8, language = 'en' } = body;

    if (!channel_id) {
      return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }
    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const db = getDb();

    // Verify channel exists and belongs to user
    const channel = db
      .prepare('SELECT * FROM channels WHERE id = ? AND user_id = ?')
      .get(channel_id, DEFAULT_USER_ID) as Channel | undefined;

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const projectId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO content_projects (id, user_id, channel_id, topic, target_length_minutes, language, status, current_stage, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      projectId,
      DEFAULT_USER_ID,
      channel_id,
      topic.trim(),
      Number(target_length_minutes) || 8,
      language || channel.language,
      'PENDING',
      'SCRIPT',
      now,
      now
    );

    // Trigger asynchronous background worker
    videoWorker.startProjectPipeline(projectId);

    return NextResponse.json(
      {
        message: 'Video project created and generation queued',
        projectId,
        status: 'PENDING',
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create project' }, { status: 500 });
  }
}
