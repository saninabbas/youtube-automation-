import { v4 as uuidv4 } from 'uuid';
import { getDb, ContentProject, Channel, VideoScene, GeneratedAsset, VideoJob } from '../db';
import { aiProvider, ScriptStructure } from '../providers/aiProvider';
import { videoProvider } from '../providers/videoProvider';
import { voiceProvider } from '../providers/voiceProvider';
import { subtitleProvider } from '../providers/subtitleProvider';
import { videoRenderer } from '../providers/renderer';
import { storage } from '../storage';

export type PipelineStage = 'SCRIPT' | 'SCENES' | 'VIDEO' | 'VOICE' | 'SUBTITLES' | 'FINAL_VIDEO';

export const PIPELINE_STAGES: PipelineStage[] = [
  'SCRIPT',
  'SCENES',
  'VIDEO',
  'VOICE',
  'SUBTITLES',
  'FINAL_VIDEO',
];

export class VideoPipelineWorker {
  private activeJobs = new Set<string>();

  public startProjectPipeline(projectId: string, fromStage?: PipelineStage): void {
    if (this.activeJobs.has(projectId)) {
      console.log(`Pipeline for project ${projectId} is already running.`);
      return;
    }

    this.activeJobs.add(projectId);
    // Execute asynchronously in background
    setTimeout(async () => {
      try {
        await this.processPipeline(projectId, fromStage);
      } catch (err) {
        console.error(`Pipeline fatal error for project ${projectId}:`, err);
      } finally {
        this.activeJobs.delete(projectId);
      }
    }, 50);
  }

  private async processPipeline(projectId: string, fromStage?: PipelineStage): Promise<void> {
    const db = getDb();

    const project = db
      .prepare('SELECT * FROM content_projects WHERE id = ?')
      .get(projectId) as ContentProject | undefined;

    if (!project) {
      console.error(`Project ${projectId} not found`);
      return;
    }

    const channel = db
      .prepare('SELECT * FROM channels WHERE id = ?')
      .get(project.channel_id) as Channel | undefined;

    if (!channel) {
      console.error(`Channel ${project.channel_id} not found`);
      return;
    }

    // Initialize all stage jobs if not present
    for (const stage of PIPELINE_STAGES) {
      const existingJob = db
        .prepare('SELECT * FROM video_jobs WHERE project_id = ? AND stage = ?')
        .get(projectId, stage);

      if (!existingJob) {
        db.prepare(
          'INSERT INTO video_jobs (id, project_id, stage, status) VALUES (?, ?, ?, ?)'
        ).run(uuidv4(), projectId, stage, 'PENDING');
      }
    }

    // Determine starting index
    let startIndex = 0;
    if (fromStage) {
      const stageIdx = PIPELINE_STAGES.indexOf(fromStage);
      if (stageIdx >= 0) {
        startIndex = stageIdx;
      }
    }

    // Mark project processing
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE content_projects SET status = ?, current_stage = ?, error_message = NULL, updated_at = ? WHERE id = ?'
    ).run('PROCESSING', PIPELINE_STAGES[startIndex], now, projectId);

    for (let i = startIndex; i < PIPELINE_STAGES.length; i++) {
      const stage = PIPELINE_STAGES[i];
      const stageStartTime = new Date().toISOString();

      // Mark stage PROCESSING
      db.prepare(
        'UPDATE video_jobs SET status = ?, started_at = ?, error_message = NULL WHERE project_id = ? AND stage = ?'
      ).run('PROCESSING', stageStartTime, projectId, stage);

      db.prepare(
        'UPDATE content_projects SET current_stage = ?, updated_at = ? WHERE id = ?'
      ).run(stage, stageStartTime, projectId);

      try {
        await this.executeStage(stage, project, channel);

        // Mark stage COMPLETED
        const stageEndTime = new Date().toISOString();
        db.prepare(
          'UPDATE video_jobs SET status = ?, completed_at = ? WHERE project_id = ? AND stage = ?'
        ).run('COMPLETED', stageEndTime, projectId, stage);
      } catch (err: any) {
        const errorMsg = err?.message || 'Stage execution failed';
        console.error(`Error at stage ${stage} for project ${projectId}:`, err);

        const failTime = new Date().toISOString();
        db.prepare(
          'UPDATE video_jobs SET status = ?, error_message = ?, completed_at = ? WHERE project_id = ? AND stage = ?'
        ).run('FAILED', errorMsg, failTime, projectId, stage);

        db.prepare(
          'UPDATE content_projects SET status = ?, current_stage = ?, error_message = ?, updated_at = ? WHERE id = ?'
        ).run('FAILED', stage, errorMsg, failTime, projectId);

        return; // Halt pipeline on failure
      }
    }

    // All stages completed
    const completionTime = new Date().toISOString();
    db.prepare(
      'UPDATE content_projects SET status = ?, updated_at = ? WHERE id = ?'
    ).run('COMPLETED', completionTime, projectId);
  }

  private async executeStage(stage: PipelineStage, project: ContentProject, channel: Channel): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();

    switch (stage) {
      case 'SCRIPT': {
        const { script, fullNarration } = await aiProvider.generateScript({
          channelName: channel.name,
          niche: channel.niche,
          language: project.language || channel.language,
          topic: project.topic,
          targetLengthMinutes: project.target_length_minutes,
        });

        const scriptKey = `scripts/${project.id}/script.json`;
        const res = await storage.putObject(scriptKey, JSON.stringify(script, null, 2), 'application/json');

        db.prepare(
          `INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          'script',
          res.key,
          res.url,
          JSON.stringify({ fullNarration, title: script.title }),
          now
        );
        break;
      }

      case 'SCENES': {
        const scriptAsset = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'script' ORDER BY created_at DESC LIMIT 1")
          .get(project.id) as GeneratedAsset | undefined;

        if (!scriptAsset) {
          throw new Error('Script asset missing for scene generation');
        }

        const scriptData = await storage.getObject(scriptAsset.storage_key);
        if (!scriptData) {
          throw new Error('Script content could not be read from storage');
        }

        const script: ScriptStructure = JSON.parse(scriptData.toString('utf8'));
        const scenes = await aiProvider.generateScenes({
          script,
          niche: channel.niche,
          language: project.language || channel.language,
          targetLengthMinutes: project.target_length_minutes,
        });

        // Clear any previous scenes if retrying
        db.prepare('DELETE FROM video_scenes WHERE project_id = ?').run(project.id);

        const insertSceneStmt = db.prepare(
          `INSERT INTO video_scenes (id, project_id, scene_index, narration, visual_prompt, estimated_duration_sec, subtitle_text, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );

        for (const scene of scenes) {
          insertSceneStmt.run(
            uuidv4(),
            project.id,
            scene.sceneIndex,
            scene.narration,
            scene.visualPrompt,
            scene.estimatedDurationSec,
            scene.subtitleText,
            now
          );
        }
        break;
      }

      case 'VIDEO': {
        const scenes = db
          .prepare('SELECT * FROM video_scenes WHERE project_id = ? ORDER BY scene_index ASC')
          .all(project.id) as VideoScene[];

        if (scenes.length === 0) {
          throw new Error('No scenes found for video clip generation');
        }

        // Remove old clip assets on retry
        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'clip'").run(project.id);

        for (const scene of scenes) {
          const clips = await videoProvider.generateVideoClipsForScene({
            projectId: project.id,
            sceneId: scene.id,
            sceneIndex: scene.scene_index,
            visualPrompt: scene.visual_prompt,
            durationSec: scene.estimated_duration_sec,
            niche: channel.niche,
          });

          for (const clip of clips) {
            db.prepare(
              `INSERT INTO generated_assets (id, project_id, scene_id, asset_type, storage_key, url, duration_sec, metadata_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              uuidv4(),
              project.id,
              scene.id,
              'clip',
              clip.storageKey,
              clip.url,
              clip.durationSec,
              JSON.stringify({ clipIndex: clip.clipIndex, sceneIndex: scene.scene_index }),
              now
            );
          }
        }
        break;
      }

      case 'VOICE': {
        const scenes = db
          .prepare('SELECT * FROM video_scenes WHERE project_id = ? ORDER BY scene_index ASC')
          .all(project.id) as VideoScene[];

        const fullNarration = scenes.map((s) => s.narration).join('\n\n');

        const voiceRes = await voiceProvider.generateVoiceover({
          text: fullNarration,
          voiceName: channel.voice,
          language: project.language || channel.language,
          projectId: project.id,
        });

        const audioKey = `audio/${project.id}/narration.${voiceRes.format}`;
        const audioAsset = await storage.putObject(audioKey, voiceRes.audioBuffer, `audio/${voiceRes.format}`);

        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'audio'").run(project.id);

        db.prepare(
          `INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, duration_sec, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          'audio',
          audioAsset.key,
          audioAsset.url,
          voiceRes.durationSec,
          JSON.stringify({ voice: channel.voice, format: voiceRes.format }),
          now
        );
        break;
      }

      case 'SUBTITLES': {
        const scenes = db
          .prepare('SELECT * FROM video_scenes WHERE project_id = ? ORDER BY scene_index ASC')
          .all(project.id) as VideoScene[];

        const cues = subtitleProvider.generateCues(
          scenes.map((s) => ({
            sceneIndex: s.scene_index,
            estimatedDurationSec: s.estimated_duration_sec,
            subtitleText: s.subtitle_text,
          }))
        );

        const srtContent = subtitleProvider.generateSrt(cues);
        const vttContent = subtitleProvider.generateVtt(cues);

        const srtKey = `subtitles/${project.id}/captions.srt`;
        const vttKey = `subtitles/${project.id}/captions.vtt`;

        const srtAsset = await storage.putObject(srtKey, srtContent, 'text/plain');
        await storage.putObject(vttKey, vttContent, 'text/vtt');

        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'subtitles'").run(project.id);

        db.prepare(
          `INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          'subtitles',
          srtAsset.key,
          srtAsset.url,
          JSON.stringify({ cueCount: cues.length, vttKey }),
          now
        );
        break;
      }

      case 'FINAL_VIDEO': {
        const clipAssets = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'clip' ORDER BY created_at ASC")
          .all(project.id) as GeneratedAsset[];

        if (clipAssets.length === 0) {
          throw new Error('No video clips found for final video composition');
        }

        const audioAsset = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'audio' ORDER BY created_at DESC LIMIT 1")
          .get(project.id) as GeneratedAsset | undefined;

        if (!audioAsset) {
          throw new Error('Voiceover audio missing for final video composition');
        }

        const subAsset = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'subtitles' ORDER BY created_at DESC LIMIT 1")
          .get(project.id) as GeneratedAsset | undefined;

        const clipPaths = clipAssets.map((c) => storage.getFilePath(c.storage_key));
        const audioPath = storage.getFilePath(audioAsset.storage_key);
        const subPath = subAsset ? storage.getFilePath(subAsset.storage_key) : undefined;

        const totalClipDuration = clipAssets.reduce((sum, c) => sum + (c.duration_sec || 0), 0);

        const composition = await videoRenderer.renderVideo({
          projectId: project.id,
          clipFilePaths: clipPaths,
          audioFilePath: audioPath,
          subtitleFilePath: subPath,
          totalDurationSec: totalClipDuration,
        });

        // Store video output record
        db.prepare('DELETE FROM video_outputs WHERE project_id = ?').run(project.id);
        db.prepare(
          `INSERT INTO video_outputs (id, project_id, storage_key, url, duration_sec, resolution, filesize_bytes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          composition.storageKey,
          composition.url,
          composition.durationSec,
          composition.resolution,
          composition.filesizeBytes,
          now
        );

        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'final_video'").run(project.id);
        db.prepare(
          `INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, duration_sec, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          'final_video',
          composition.storageKey,
          composition.url,
          composition.durationSec,
          JSON.stringify({ resolution: composition.resolution, filesizeBytes: composition.filesizeBytes }),
          now
        );
        break;
      }
    }
  }
}

export const videoWorker = new VideoPipelineWorker();
