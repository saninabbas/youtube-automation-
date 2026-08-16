import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, DEFAULT_USER_ID, Channel } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const channels = db
      .prepare(
        `SELECT c.*, COUNT(p.id) as video_count 
         FROM channels c 
         LEFT JOIN content_projects p ON c.id = p.channel_id 
         WHERE c.user_id = ? 
         GROUP BY c.id 
         ORDER BY c.created_at DESC`
      )
      .all(DEFAULT_USER_ID) as Channel[];

    return NextResponse.json({ channels });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch channels' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, niche, language = 'en', voice = 'en-US-ChristopherNeural' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
    }
    if (!niche || !niche.trim()) {
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO channels (id, user_id, name, niche, language, voice, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, DEFAULT_USER_ID, name.trim(), niche.trim(), language.trim(), voice.trim(), now, now);

    const created = db.prepare('SELECT * FROM channels WHERE id = ?').get(id) as Channel;
    return NextResponse.json({ channel: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create channel' }, { status: 500 });
  }
}
