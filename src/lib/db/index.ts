import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export const DEFAULT_USER_ID = 'user_default';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'app.db');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');

    // Run migrations
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql: string;
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf8');
    } else {
      // Fallback for bundled runtime
      schemaSql = `
        CREATE TABLE IF NOT EXISTS channels (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          niche TEXT NOT NULL,
          language TEXT NOT NULL DEFAULT 'en',
          voice TEXT NOT NULL DEFAULT 'en-US-ChristopherNeural',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS content_projects (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          topic TEXT NOT NULL,
          target_length_minutes INTEGER NOT NULL DEFAULT 8,
          language TEXT NOT NULL DEFAULT 'en',
          status TEXT NOT NULL DEFAULT 'PENDING',
          current_stage TEXT NOT NULL DEFAULT 'SCRIPT',
          error_message TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS video_scenes (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          scene_index INTEGER NOT NULL,
          narration TEXT NOT NULL,
          visual_prompt TEXT NOT NULL,
          estimated_duration_sec REAL NOT NULL,
          subtitle_text TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES content_projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS generated_assets (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          scene_id TEXT,
          asset_type TEXT NOT NULL,
          storage_key TEXT NOT NULL,
          url TEXT NOT NULL,
          duration_sec REAL,
          metadata_json TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES content_projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS video_jobs (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          stage TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          error_message TEXT,
          started_at TEXT,
          completed_at TEXT,
          FOREIGN KEY (project_id) REFERENCES content_projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS video_outputs (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL UNIQUE,
          storage_key TEXT NOT NULL,
          url TEXT NOT NULL,
          duration_sec REAL NOT NULL,
          resolution TEXT NOT NULL DEFAULT '1920x1080',
          filesize_bytes INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES content_projects(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_channels_user ON channels(user_id);
        CREATE INDEX IF NOT EXISTS idx_projects_user ON content_projects(user_id);
        CREATE INDEX IF NOT EXISTS idx_projects_channel ON content_projects(channel_id);
        CREATE INDEX IF NOT EXISTS idx_scenes_project ON video_scenes(project_id, scene_index);
        CREATE INDEX IF NOT EXISTS idx_assets_project ON generated_assets(project_id);
        CREATE INDEX IF NOT EXISTS idx_jobs_project ON video_jobs(project_id, stage);
      `;
    }
    dbInstance.exec(schemaSql);
  }
  return dbInstance;
}

export interface Channel {
  id: string;
  user_id: string;
  name: string;
  niche: string;
  language: string;
  voice: string;
  created_at: string;
  updated_at: string;
  video_count?: number;
}

export interface ContentProject {
  id: string;
  user_id: string;
  channel_id: string;
  channel_name?: string;
  channel_niche?: string;
  topic: string;
  target_length_minutes: number;
  language: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  current_stage: 'SCRIPT' | 'SCENES' | 'VIDEO' | 'VOICE' | 'SUBTITLES' | 'FINAL_VIDEO';
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoScene {
  id: string;
  project_id: string;
  scene_index: number;
  narration: string;
  visual_prompt: string;
  estimated_duration_sec: number;
  subtitle_text: string;
  created_at: string;
}

export interface GeneratedAsset {
  id: string;
  project_id: string;
  scene_id?: string | null;
  asset_type: 'script' | 'clip' | 'audio' | 'subtitles' | 'final_video';
  storage_key: string;
  url: string;
  duration_sec?: number | null;
  metadata_json?: string | null;
  created_at: string;
}

export interface VideoJob {
  id: string;
  project_id: string;
  stage: 'SCRIPT' | 'SCENES' | 'VIDEO' | 'VOICE' | 'SUBTITLES' | 'FINAL_VIDEO';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface VideoOutput {
  id: string;
  project_id: string;
  storage_key: string;
  url: string;
  duration_sec: number;
  resolution: string;
  filesize_bytes: number;
  created_at: string;
}
