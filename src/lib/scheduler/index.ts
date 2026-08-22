import { getDb, DEFAULT_USER_ID, ContentProject, Channel, VideoOutput, GeneratedAsset } from '../db';
import { publishingProvider, SupportedPlatform } from '../providers/publishingProvider';
import { storage } from '../storage';

export interface SchedulerRunResult {
  processedCount: number;
  publishedCount: number;
  failedCount: number;
  details: Array<{
    projectId: string;
    topic: string;
    status: string;
    videoId?: string;
    error?: string;
  }>;
}

class BackgroundPublishingScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  public start(intervalMs = 30000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.checkAndPublishDueVideos().catch((err) => {
        console.error('Scheduler periodic check error:', err);
      });
    }, intervalMs);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async checkAndPublishDueVideos(userId: string = DEFAULT_USER_ID): Promise<SchedulerRunResult> {
    if (this.isRunning) {
      return { processedCount: 0, publishedCount: 0, failedCount: 0, details: [] };
    }

    this.isRunning = true;
    const db = getDb();
    const nowIso = new Date().toISOString();

    const result: SchedulerRunResult = {
      processedCount: 0,
      publishedCount: 0,
      failedCount: 0,
      details: [],
    };

    try {
      // Find all completed projects that are scheduled and ready to publish
      const dueProjects = db
        .prepare(
          `SELECT p.*, c.name as channel_name, c.publishing_platform as channel_platform, c.default_visibility 
           FROM content_projects p 
           JOIN channels c ON p.channel_id = c.id 
           WHERE p.status = 'COMPLETED' 
             AND p.publishing_status = 'SCHEDULED' 
             AND p.scheduled_at IS NOT NULL 
             AND p.scheduled_at <= ? 
           ORDER BY p.scheduled_at ASC`
        )
        .all(nowIso) as (ContentProject & { channel_name: string; channel_platform: string; default_visibility: string })[];

      result.processedCount = dueProjects.length;

      for (const proj of dueProjects) {
        const publishStartTime = new Date().toISOString();

        // Mark project as UPLOADING
        db.prepare(
          `UPDATE content_projects SET 
            publishing_status = 'UPLOADING', 
            publish_started_at = ?, 
            publish_error = NULL, 
            updated_at = ? 
           WHERE id = ?`
        ).run(publishStartTime, publishStartTime, proj.id);

        const output = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(proj.id) as VideoOutput | undefined;
        const thumbnail = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'thumbnail' ORDER BY created_at DESC LIMIT 1").get(proj.id) as GeneratedAsset | undefined;

        if (!output) {
          const errMsg = 'No output video file found for scheduled publishing.';
          db.prepare(
            `UPDATE content_projects SET publishing_status = 'FAILED', publish_error = ?, updated_at = ? WHERE id = ?`
          ).run(errMsg, new Date().toISOString(), proj.id);

          result.failedCount++;
          result.details.push({ projectId: proj.id, topic: proj.topic, status: 'FAILED', error: errMsg });
          continue;
        }

        const videoFilePath = storage.getFilePath(output.storage_key);
        const thumbnailFilePath = thumbnail ? storage.getFilePath(thumbnail.storage_key) : undefined;

        let parsedMeta = { youtubeTitle: proj.topic, description: proj.topic, tags: [] as string[] };
        if (proj.metadata_json) {
          try {
            parsedMeta = JSON.parse(proj.metadata_json);
          } catch {}
        }

        const pubResult = await publishingProvider.publishVideo({
          projectId: proj.id,
          platform: (proj.platform as SupportedPlatform) || 'YouTube',
          videoFilePath,
          title: parsedMeta.youtubeTitle || proj.topic,
          description: parsedMeta.description || proj.topic,
          tags: parsedMeta.tags || [],
          thumbnailFilePath,
          visibility: proj.visibility || (proj.default_visibility as any) || 'PRIVATE',
          userId: proj.user_id || userId,
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
            proj.id
          );

          result.publishedCount++;
          result.details.push({
            projectId: proj.id,
            topic: proj.topic,
            status: 'PUBLISHED',
            videoId: pubResult.platformVideoId,
          });
        } else {
          db.prepare(
            `UPDATE content_projects SET 
              publishing_status = 'FAILED', 
              publish_error = ?, 
              updated_at = ? 
             WHERE id = ?`
          ).run(pubResult.errorMessage || 'Publishing provider rejected upload', publishEndTime, proj.id);

          result.failedCount++;
          result.details.push({
            projectId: proj.id,
            topic: proj.topic,
            status: 'FAILED',
            error: pubResult.errorMessage,
          });
        }
      }
    } finally {
      this.isRunning = false;
    }

    return result;
  }

  public calculateNextReleaseSlot(channel: Channel): string {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let targetDays: string[] = ['Monday', 'Wednesday', 'Friday'];

    try {
      if (channel.publishing_days) {
        targetDays = JSON.parse(channel.publishing_days);
      }
    } catch {}

    const [pubHour, pubMinute] = (channel.publishing_time || '14:00').split(':').map(Number);

    const now = new Date();
    for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
      const candidate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      candidate.setUTCHours(pubHour || 14, pubMinute || 0, 0, 0);

      const dayName = daysOfWeek[candidate.getUTCDay()];
      if (targetDays.includes(dayName) && candidate.getTime() > now.getTime() + 5 * 60 * 1000) {
        return candidate.toISOString();
      }
    }

    // Default 24 hours from now
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
}

export const publishingScheduler = new BackgroundPublishingScheduler();
