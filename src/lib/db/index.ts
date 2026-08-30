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
    safeAddColumn('user_sessions', 'session_token', 'TEXT');
    safeAddColumn('user_sessions', 'user_agent', 'TEXT');
    safeAddColumn('user_sessions', 'ip_address', 'TEXT');

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

      CREATE TABLE IF NOT EXISTS api_credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        api_key TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, provider)
      );
      CREATE INDEX IF NOT EXISTS idx_api_credentials_user ON api_credentials(user_id, provider);

      CREATE TABLE IF NOT EXISTS user_credits (
        user_id TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 500,
        tier TEXT NOT NULL DEFAULT 'CREATOR',
        subscription_status TEXT NOT NULL DEFAULT 'ACTIVE',
        monthly_allowance INTEGER NOT NULL DEFAULT 500,
        renews_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        project_id TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, created_at);

      CREATE TABLE IF NOT EXISTS billing_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price_monthly INTEGER NOT NULL,
        credits_monthly INTEGER NOT NULL,
        max_channels INTEGER NOT NULL,
        resolution TEXT NOT NULL,
        features_json TEXT NOT NULL,
        is_popular INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS automation_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        format TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        visual_style TEXT NOT NULL,
        voice TEXT NOT NULL,
        niche TEXT NOT NULL,
        icon TEXT NOT NULL,
        prompt_starter TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        verification_token TEXT,
        verification_token_expires TEXT,
        reset_token TEXT,
        reset_token_expires TEXT,
        role TEXT NOT NULL DEFAULT 'CUSTOMER',
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
    `);

    // Ensure default demo user exists for smooth local development & onboarding
    try {
      const defaultUser = dbInstance.prepare('SELECT id FROM users WHERE id = ?').get(DEFAULT_USER_ID);
      if (!defaultUser) {
        dbInstance.prepare(`
          INSERT INTO users (id, email, password_hash, salt, name, email_verified, role, status, onboarding_completed, created_at, updated_at)
          VALUES (?, 'creator@autovideo.ai', 'demo_hash_seeded', 'demo_salt', 'Creative Director', 1, 'CUSTOMER', 'ACTIVE', 1, ?, ?)
        `).run(DEFAULT_USER_ID, new Date().toISOString(), new Date().toISOString());
      }
    } catch {}

    // Ensure default user has credits initialized
    try {
      const existingCredits = dbInstance.prepare('SELECT balance FROM user_credits WHERE user_id = ?').get(DEFAULT_USER_ID);
      if (!existingCredits) {
        dbInstance.prepare(`
          INSERT INTO user_credits (user_id, balance, tier, subscription_status, monthly_allowance, renews_at, updated_at)
          VALUES (?, 500, 'CREATOR', 'ACTIVE', 500, ?, ?)
        `).run(DEFAULT_USER_ID, new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), new Date().toISOString());
      }
    } catch {}

    // Customer auth tables (multi-tenant SaaS)
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(email)
      );
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

      CREATE TABLE IF NOT EXISTS customer_sessions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        ip TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_customer ON customer_sessions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON customer_sessions(token_hash);

      CREATE TABLE IF NOT EXISTS email_verifications (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        plan TEXT NOT NULL DEFAULT 'FREE',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_workspaces_customer ON workspaces(customer_id);

      CREATE TABLE IF NOT EXISTS workspace_members (
        workspace_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'OWNER',
        joined_at TEXT NOT NULL,
        PRIMARY KEY (workspace_id, customer_id),
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
      );
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

export interface ApiCredential {
  id: string;
  user_id: string;
  provider: 'gemini' | 'openai' | 'runway' | 'replicate' | 'fal' | string;
  api_key: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export function maskApiKey(key?: string | null): string {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '********';
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}********${suffix}`;
}

export function getApiKey(provider: string, userId: string = DEFAULT_USER_ID): string | null {
  try {
    const db = getDb();
    const row = db.prepare('SELECT api_key FROM api_credentials WHERE user_id = ? AND provider = ? AND is_active = 1').get(userId, provider.toLowerCase()) as { api_key: string } | undefined;
    if (row && row.api_key && row.api_key.trim()) {
      return row.api_key.trim();
    }
  } catch (err) {
    console.warn(`Error reading API key for provider ${provider}:`, err);
  }

  // Fallback to environment variables
  if (provider.toLowerCase() === 'gemini') {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  }
  if (provider.toLowerCase() === 'openai') {
    return process.env.OPENAI_API_KEY || null;
  }
  if (provider.toLowerCase() === 'runway') {
    return process.env.RUNWAY_API_KEY || null;
  }
  if (provider.toLowerCase() === 'replicate') {
    return process.env.REPLICATE_API_TOKEN || null;
  }
  if (provider.toLowerCase() === 'fal') {
    return process.env.FAL_KEY || process.env.FAL_AI_KEY || null;
  }
  return null;
}

export function saveApiKey(provider: string, apiKey: string, userId: string = DEFAULT_USER_ID): boolean {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const normalizedProvider = provider.toLowerCase().trim();
    const normalizedKey = apiKey.trim();

    if (!normalizedKey) {
      db.prepare('DELETE FROM api_credentials WHERE user_id = ? AND provider = ?').run(userId, normalizedProvider);
      return true;
    }

    db.prepare(`
      INSERT INTO api_credentials (id, user_id, provider, api_key, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(user_id, provider) DO UPDATE SET
        api_key = excluded.api_key,
        is_active = 1,
        updated_at = excluded.updated_at
    `).run(
      `cred_${userId}_${normalizedProvider}`,
      userId,
      normalizedProvider,
      normalizedKey,
      now,
      now
    );
    return true;
  } catch (err) {
    console.error(`Failed to save API key for provider ${provider}:`, err);
    return false;
  }
}

export function getAllApiCredentials(userId: string = DEFAULT_USER_ID): Record<string, { configured: boolean; maskedKey: string; source: 'database' | 'env' | 'none' }> {
  const providers = [
    'gemini',
    'openai',
    'cloudflare_account_id',
    'cloudflare_api_token',
    'pexels',
    'pixabay',
    'elevenlabs',
    'runway',
    'replicate',
    'fal'
  ];
  const result: Record<string, { configured: boolean; maskedKey: string; source: 'database' | 'env' | 'none' }> = {};

  const db = getDb();
  const dbRows = db.prepare('SELECT provider, api_key FROM api_credentials WHERE user_id = ? AND is_active = 1').all(userId) as Array<{ provider: string; api_key: string }>;
  const dbMap = new Map(dbRows.map((r) => [r.provider.toLowerCase(), r.api_key]));

  for (const p of providers) {
    const dbKey = dbMap.get(p);
    if (dbKey) {
      result[p] = {
        configured: true,
        maskedKey: maskApiKey(dbKey),
        source: 'database',
      };
      continue;
    }

    let envKey: string | undefined;
    if (p === 'gemini') envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    else if (p === 'openai') envKey = process.env.OPENAI_API_KEY;
    else if (p === 'cloudflare_account_id') envKey = process.env.CLOUDFLARE_ACCOUNT_ID;
    else if (p === 'cloudflare_api_token') envKey = process.env.CLOUDFLARE_API_TOKEN;
    else if (p === 'pexels') envKey = process.env.PEXELS_API_KEY;
    else if (p === 'pixabay') envKey = process.env.PIXABAY_API_KEY;
    else if (p === 'elevenlabs') envKey = process.env.ELEVENLABS_API_KEY;
    else if (p === 'runway') envKey = process.env.RUNWAY_API_KEY;
    else if (p === 'replicate') envKey = process.env.REPLICATE_API_TOKEN;
    else if (p === 'fal') envKey = process.env.FAL_KEY || process.env.FAL_AI_KEY;

    if (envKey && envKey.trim()) {
      result[p] = {
        configured: true,
        maskedKey: maskApiKey(envKey),
        source: 'env',
      };
    } else {
      result[p] = {
        configured: false,
        maskedKey: '',
        source: 'none',
      };
    }
  }

  return result;
}

export function getUserCredits(userId: string = DEFAULT_USER_ID): { balance: number; tier: string; subscription_status: string; monthly_allowance: number } {
  const db = getDb();
  const row = db.prepare('SELECT balance, tier, subscription_status, monthly_allowance FROM user_credits WHERE user_id = ?').get(userId) as any;
  if (!row) {
    return { balance: 500, tier: 'CREATOR', subscription_status: 'ACTIVE', monthly_allowance: 500 };
  }
  return row;
}

export function deductUserCredits(userId: string = DEFAULT_USER_ID, amount: number, type: string, description: string, projectId?: string): boolean {
  const db = getDb();
  const current = getUserCredits(userId);
  if (current.balance < amount) return false;

  const newBalance = current.balance - amount;
  db.prepare('UPDATE user_credits SET balance = ?, updated_at = ? WHERE user_id = ?').run(newBalance, new Date().toISOString(), userId);
  db.prepare(`
    INSERT INTO credit_transactions (id, user_id, amount, balance_after, type, description, project_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(Math.random().toString(36).substring(2), userId, -amount, newBalance, type, description, projectId || null, new Date().toISOString());

  return true;
}

// ============================================================
// CUSTOMER AUTH INTERFACES & HELPERS
// ============================================================

export interface Customer {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  avatar_url?: string | null;
  email_verified: number; // 0 | 1
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerSession {
  id: string;
  customer_id: string;
  token_hash: string;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
  expires_at: string;
  revoked_at?: string | null;
}

export interface Workspace {
  id: string;
  customer_id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export function getCustomerByEmail(email: string): Customer | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE email = ? AND deleted_at IS NULL').get(email.toLowerCase().trim()) as Customer | undefined;
  return row || null;
}

export function getCustomerById(id: string): Customer | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL').get(id) as Customer | undefined;
  return row || null;
}

export function createCustomer(data: { id: string; name: string; email: string; password_hash: string }): Customer {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO customers (id, name, email, password_hash, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `).run(data.id, data.name, data.email.toLowerCase().trim(), data.password_hash, now, now);
  return getCustomerById(data.id) as Customer;
}

export function updateCustomer(id: string, updates: Partial<Pick<Customer, 'name' | 'avatar_url' | 'email_verified' | 'password_hash'>>): void {
  const db = getDb();
  const now = new Date().toISOString();
  const fields = Object.entries(updates).map(([k]) => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE customers SET ${fields}, updated_at = ? WHERE id = ?`).run(...values, now, id);
}

export function softDeleteCustomer(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE customers SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);
  db.prepare('UPDATE customer_sessions SET revoked_at = ? WHERE customer_id = ? AND revoked_at IS NULL').run(now, id);
}

export function createSession(data: { id: string; customer_id: string; token_hash: string; ip?: string; user_agent?: string }): void {
  const db = getDb();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(); // 30 days
  db.prepare(`
    INSERT INTO customer_sessions (id, customer_id, token_hash, ip, user_agent, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.id, data.customer_id, data.token_hash, data.ip || null, data.user_agent || null, now, expiresAt);
}

export function validateSession(tokenHash: string): Customer | null {
  const db = getDb();
  const now = new Date().toISOString();
  const session = db.prepare(`
    SELECT s.customer_id FROM customer_sessions s
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?
  `).get(tokenHash, now) as { customer_id: string } | undefined;
  if (!session) return null;
  return getCustomerById(session.customer_id);
}

export function invalidateSession(tokenHash: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE customer_sessions SET revoked_at = ? WHERE token_hash = ?').run(now, tokenHash);
}

export function invalidateAllSessions(customerId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE customer_sessions SET revoked_at = ? WHERE customer_id = ? AND revoked_at IS NULL').run(now, customerId);
}

export function listActiveSessions(customerId: string): CustomerSession[] {
  const db = getDb();
  const now = new Date().toISOString();
  return db.prepare(`
    SELECT id, customer_id, ip, user_agent, created_at, expires_at
    FROM customer_sessions
    WHERE customer_id = ? AND revoked_at IS NULL AND expires_at > ?
    ORDER BY created_at DESC
  `).all(customerId, now) as CustomerSession[];
}

export function createEmailVerification(data: { id: string; customer_id: string; token_hash: string }): void {
  const db = getDb();
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); // 24 hours
  db.prepare(`
    INSERT INTO email_verifications (id, customer_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(token_hash) DO NOTHING
  `).run(data.id, data.customer_id, data.token_hash, expiresAt);
}

export function consumeEmailVerification(tokenHash: string): string | null {
  const db = getDb();
  const now = new Date().toISOString();
  const row = db.prepare(`
    SELECT id, customer_id FROM email_verifications
    WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL
  `).get(tokenHash, now) as { id: string; customer_id: string } | undefined;
  if (!row) return null;
  db.prepare('UPDATE email_verifications SET used_at = ? WHERE id = ?').run(now, row.id);
  return row.customer_id;
}

export function createPasswordReset(data: { id: string; customer_id: string; token_hash: string }): void {
  const db = getDb();
  const expiresAt = new Date(Date.now() + 1 * 3600 * 1000).toISOString(); // 1 hour
  // Invalidate prior resets for this customer
  db.prepare('UPDATE password_resets SET used_at = ? WHERE customer_id = ? AND used_at IS NULL').run(new Date().toISOString(), data.customer_id);
  db.prepare(`
    INSERT INTO password_resets (id, customer_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(data.id, data.customer_id, data.token_hash, expiresAt);
}

export function consumePasswordReset(tokenHash: string): string | null {
  const db = getDb();
  const now = new Date().toISOString();
  const row = db.prepare(`
    SELECT id, customer_id FROM password_resets
    WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL
  `).get(tokenHash, now) as { id: string; customer_id: string } | undefined;
  if (!row) return null;
  db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(now, row.id);
  return row.customer_id;
}

export function createWorkspace(data: { id: string; customer_id: string; name: string; slug: string }): Workspace {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO workspaces (id, customer_id, name, slug, plan, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'FREE', ?, ?)
  `).run(data.id, data.customer_id, data.name, data.slug, now, now);
  db.prepare(`
    INSERT INTO workspace_members (workspace_id, customer_id, role, joined_at)
    VALUES (?, ?, 'OWNER', ?)
  `).run(data.id, data.customer_id, now);
  return db.prepare('SELECT * FROM workspaces WHERE id = ?').get(data.id) as Workspace;
}

export function getWorkspacesByCustomer(customerId: string): Workspace[] {
  const db = getDb();
  return db.prepare('SELECT * FROM workspaces WHERE customer_id = ? ORDER BY created_at ASC').all(customerId) as Workspace[];
}
