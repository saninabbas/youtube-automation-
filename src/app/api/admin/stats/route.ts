import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { verifyAdminToken } from '../auth/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_session_token')?.value;
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }
    const db = getDb();

    // 1. Channel stats
    const totalChannels = (db.prepare('SELECT COUNT(*) as count FROM channels').get() as any)?.count || 0;
    const channelsList = db.prepare('SELECT id, name, niche, language, target_duration_minutes, publishing_platform, auto_publish, default_visibility, created_at FROM channels ORDER BY created_at DESC').all();

    // 2. Video Project stats
    const totalProjects = (db.prepare('SELECT COUNT(*) as count FROM content_projects').get() as any)?.count || 0;
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM content_projects 
      GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    const pubStatusCounts = db.prepare(`
      SELECT publishing_status, COUNT(*) as count 
      FROM content_projects 
      GROUP BY publishing_status
    `).all() as Array<{ publishing_status: string; count: number }>;

    const projectsList = db.prepare(`
      SELECT p.id, COALESCE(c.name, 'Default Channel') as channel_name, p.topic, p.status, p.current_stage, p.publishing_status, p.publish_url, p.created_at, p.target_length_minutes
      FROM content_projects p
      LEFT JOIN channels c ON p.channel_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `).all();


    // 3. YouTube Connections
    const totalConnections = (db.prepare('SELECT COUNT(*) as count FROM oauth_connections').get() as any)?.count || 0;
    const connectionsList = db.prepare('SELECT id, platform, account_email, channel_id, channel_title, token_expiry, created_at FROM oauth_connections').all();

    // 4. Storage Calculation
    let totalStorageBytes = 0;
    const storageDir = path.join(process.cwd(), 'storage');
    if (fs.existsSync(storageDir)) {
      const getDirSize = (dirPath: string): number => {
        let size = 0;
        try {
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              size += getDirSize(filePath);
            } else {
              size += stat.size;
            }
          }
        } catch {
          // Ignore inaccessible files
        }
        return size;
      };
      totalStorageBytes = getDirSize(storageDir);
    }

    const storageMb = Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10;

    // Map status metrics
    const statusMap: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      FAILED: 0,
    };
    for (const item of statusCounts) {
      statusMap[item.status] = item.count;
    }

    const pubStatusMap: Record<string, number> = {
      DRAFT: 0,
      READY: 0,
      SCHEDULED: 0,
      UPLOADING: 0,
      PUBLISHED: 0,
      FAILED: 0,
    };
    for (const item of pubStatusCounts) {
      if (item.publishing_status) {
        pubStatusMap[item.publishing_status] = item.count;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalChannels,
        totalProjects,
        totalConnections,
        storageMb,
        statusMap,
        pubStatusMap,
      },
      channels: channelsList,
      recentProjects: projectsList,
      connections: connectionsList,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch admin statistics' }, { status: 500 });
  }
}
