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

    // Run schema initialization
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql: string;
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf8');
    } else {
      schemaSql = `
        CREATE TABLE IF NOT EXISTS channels (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          niche TEXT NOT NULL,
          language TEXT NOT NULL DEFAULT 'en',
          voice TEXT NOT NULL DEFAULT 'en-US-ChristopherNeural',
          voice_speed TEXT NOT NULL DEFAULT '1.0x',
          target_duration_minutes INTEGER NOT NULL DEFAULT 5,
          visual_style TEXT NOT NULL DEFAULT 'Cinematic High-Contrast',
          subtitle_style TEXT NOT NULL DEFAULT 'Modern Clean White',
          intro_style TEXT NOT NULL DEFAULT 'High-Impact Dramatic Question',
          outro_cta TEXT NOT NULL DEFAULT 'Subscribe to the channel and leave your thoughts below',
          publishing_platform TEXT NOT NULL DEFAULT 'YouTube',
          content_rules TEXT NOT NULL DEFAULT 'Engaging, clear, professional tone',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS content_projects (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          topic TEXT NOT NULL,
          target_length_minutes INTEGER NOT NULL DEFAULT 8,
          preset TEXT NOT NULL DEFAULT 'STANDARD',
          language TEXT NOT NULL DEFAULT 'en',
          platform TEXT NOT NULL DEFAULT 'YouTube',
          status TEXT NOT NULL DEFAULT 'PENDING',
          current_stage TEXT NOT NULL DEFAULT 'SCRIPT',
          error_message TEXT,
          scheduled_at TEXT,
          published_at TEXT,
          metadata_json TEXT,
          telemetry_json TEXT,
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
          visual_subject TEXT,
          environment TEXT,
          camera_movement TEXT,
          lighting TEXT,
          color_style TEXT,
          continuity_notes TEXT,
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

    // Apply incremental migrations for existing DB instances safely
    const safeAddColumn = (table: string, column: string, typeDef: string) => {
      try {
        dbInstance?.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`).run();
      } catch {
        // column already exists
      }
    };

    safeAddColumn('channels', 'voice_speed', "TEXT NOT NULL DEFAULT '1.0x'");
    safeAddColumn('channels', 'target_duration_minutes', 'INTEGER NOT NULL DEFAULT 5');
    safeAddColumn('channels', 'visual_style', "TEXT NOT NULL DEFAULT 'Cinematic High-Contrast'");
    safeAddColumn('channels', 'subtitle_style', "TEXT NOT NULL DEFAULT 'Modern Clean White'");
    safeAddColumn('channels', 'intro_style', "TEXT NOT NULL DEFAULT 'High-Impact Dramatic Question'");
    safeAddColumn('channels', 'outro_cta', "TEXT NOT NULL DEFAULT 'Subscribe to the channel and leave your thoughts below'");
    safeAddColumn('channels', 'publishing_platform', "TEXT NOT NULL DEFAULT 'YouTube'");
    safeAddColumn('channels', 'content_rules', "TEXT NOT NULL DEFAULT 'Engaging, clear, professional tone'");

    safeAddColumn('channels', 'publishing_days', "TEXT NOT NULL DEFAULT '[\"Monday\",\"Wednesday\",\"Friday\"]'");
    safeAddColumn('channels', 'publishing_time', "TEXT NOT NULL DEFAULT '14:00'");
    safeAddColumn('channels', 'timezone', "TEXT NOT NULL DEFAULT 'UTC'");
    safeAddColumn('channels', 'default_visibility', "TEXT NOT NULL DEFAULT 'PRIVATE'");
    safeAddColumn('channels', 'auto_publish', 'INTEGER NOT NULL DEFAULT 0');

    safeAddColumn('content_projects', 'preset', "TEXT NOT NULL DEFAULT 'STANDARD'");
    safeAddColumn('content_projects', 'platform', "TEXT NOT NULL DEFAULT 'YouTube'");
    safeAddColumn('content_projects', 'visibility', "TEXT NOT NULL DEFAULT 'PRIVATE'");
    safeAddColumn('content_projects', 'scheduled_at', 'TEXT');
    safeAddColumn('content_projects', 'published_at', 'TEXT');
    safeAddColumn('content_projects', 'publishing_status', "TEXT NOT NULL DEFAULT 'DRAFT'");
    safeAddColumn('content_projects', 'publish_provider', 'TEXT');
    safeAddColumn('content_projects', 'publish_video_id', 'TEXT');
    safeAddColumn('content_projects', 'publish_url', 'TEXT');
    safeAddColumn('content_projects', 'publish_started_at', 'TEXT');
    safeAddColumn('content_projects', 'publish_completed_at', 'TEXT');
    safeAddColumn('content_projects', 'publish_error', 'TEXT');
    safeAddColumn('content_projects', 'auto_publish', 'INTEGER NOT NULL DEFAULT 0');
    safeAddColumn('content_projects', 'metadata_json', 'TEXT');
    safeAddColumn('content_projects', 'telemetry_json', 'TEXT');

    safeAddColumn('video_scenes', 'visual_subject', 'TEXT');
    safeAddColumn('video_scenes', 'environment', 'TEXT');
    safeAddColumn('video_scenes', 'camera_movement', 'TEXT');
    safeAddColumn('video_scenes', 'lighting', 'TEXT');
    safeAddColumn('video_scenes', 'color_style', 'TEXT');
    safeAddColumn('video_scenes', 'continuity_notes', 'TEXT');

    // Create oauth_connections table if missing
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS oauth_connections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        account_email TEXT,
        channel_id TEXT,
        channel_title TEXT,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expiry TEXT,
        scope TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, platform)
      );
      CREATE INDEX IF NOT EXISTS idx_oauth_user_platform ON oauth_connections(user_id, platform);
    `);
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
  voice_speed: string;
  target_duration_minutes: number;
  visual_style: string;
  subtitle_style: string;
  intro_style: string;
  outro_cta: string;
  publishing_platform: string;
  content_rules: string;
  publishing_days: string; // JSON array string e.g. '["Monday","Wednesday","Friday"]'
  publishing_time: string; // e.g. '14:00'
  timezone: string; // e.g. 'UTC'
  default_visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  auto_publish: number; // 0 or 1
  created_at: string;
  updated_at: string;
  video_count?: number;
}

export interface OAuthConnection {
  id: string;
  user_id: string;
  platform: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'FACEBOOK';
  account_email?: string | null;
  channel_id?: string | null;
  channel_title?: string | null;
  access_token: string;
  refresh_token?: string | null;
  token_expiry?: string | null;
  scope?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMetadata {
  youtubeTitle: string;
  description: string;
  tags: string[];
  hashtags: string[];
  shortDescription: string;
  suggestedFilename: string;
}

export interface ProjectTelemetry {
  generationStartTime?: string;
  generationEndTime?: string;
  totalGenerationDurationSec?: number;
  sceneCount?: number;
  clipCount?: number;
  audioDurationSec?: number;
  finalVideoDurationSec?: number;
  filesizeBytes?: number;
  providerUsed?: string;
  generationStatus?: string;
  cost?: string; // Always 'UNAVAILABLE'
  publishingTelemetry?: {
    provider?: string;
    uploadStartTime?: string;
    uploadCompletionTime?: string;
    providerVideoId?: string;
    publishUrl?: string;
    visibility?: string;
    scheduledTime?: string;
    actualPublishTime?: string;
    uploadStatus?: string;
    errorMessage?: string;
  };
}

export interface ContentProject {
  id: string;
  user_id: string;
  channel_id: string;
  channel_name?: string;
  channel_niche?: string;
  channel_voice?: string;
  channel_voice_speed?: string;
  channel_visual_style?: string;
  channel_subtitle_style?: string;
  topic: string;
  target_length_minutes: number;
  preset: 'SHORT' | 'STANDARD' | 'LONG' | 'CUSTOM';
  language: string;
  platform: string;
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  current_stage: 'SCRIPT' | 'VOICE' | 'SCENES' | 'VIDEO' | 'SUBTITLES' | 'FINAL_VIDEO' | 'THUMBNAIL';
  error_message?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  publishing_status: 'DRAFT' | 'READY' | 'SCHEDULED' | 'UPLOADING' | 'PUBLISHED' | 'FAILED' | 'NOT_CONNECTED';
  publish_provider?: string | null;
  publish_video_id?: string | null;
  publish_url?: string | null;
  publish_started_at?: string | null;
  publish_completed_at?: string | null;
  publish_error?: string | null;
  auto_publish: number; // 0 or 1
  metadata_json?: string | null;
  telemetry_json?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoScene {
  id: string;
  project_id: string;
  scene_index: number;
  narration: string;
  visual_prompt: string;
  visual_subject?: string | null;
  environment?: string | null;
  camera_movement?: string | null;
  lighting?: string | null;
  color_style?: string | null;
  continuity_notes?: string | null;
  estimated_duration_sec: number;
  subtitle_text: string;
  created_at: string;
}

export interface GeneratedAsset {
  id: string;
  project_id: string;
  scene_id?: string | null;
  asset_type: 'script' | 'clip' | 'audio' | 'subtitles' | 'final_video' | 'thumbnail';
  storage_key: string;
  url: string;
  duration_sec?: number | null;
  metadata_json?: string | null;
  created_at: string;
}

export interface VideoJob {
  id: string;
  project_id: string;
  stage: 'SCRIPT' | 'VOICE' | 'SCENES' | 'VIDEO' | 'SUBTITLES' | 'FINAL_VIDEO' | 'THUMBNAIL';
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

