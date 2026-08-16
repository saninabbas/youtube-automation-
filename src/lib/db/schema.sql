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
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
  current_stage TEXT NOT NULL DEFAULT 'SCRIPT', -- SCRIPT, SCENES, VIDEO, VOICE, SUBTITLES, FINAL_VIDEO
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
  asset_type TEXT NOT NULL, -- 'script', 'clip', 'audio', 'subtitles', 'final_video'
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
  stage TEXT NOT NULL, -- 'SCRIPT', 'SCENES', 'VIDEO', 'VOICE', 'SUBTITLES', 'FINAL_VIDEO'
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
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
